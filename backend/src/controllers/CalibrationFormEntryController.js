const Ajv = require('ajv');
const {
  CalibrationFormEntry,
  CalibrationFormTemplateVersion,
  CalibrationFormTemplate,
  WorkOrderItem,
  User,
  AuditLog,
} = require('../models');
const logger = require('../config/logger');

// Mismo strict:false que CalibrationFormTemplateController (tarea 3.1): los
// schemas de este proyecto anotan `unidad` por campo, palabra clave que Ajv
// en modo estricto rechazaría como desconocida.
const ajv = new Ajv({ strict: false, allErrors: true });

const ENTRY_INCLUDES = [
  { model: User, as: 'capturadoPor', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'confirmadoPor', attributes: ['id', 'nombre', 'email'] },
  {
    model: CalibrationFormTemplateVersion,
    as: 'versionPlantilla',
    attributes: ['id', 'version', 'schema'],
    include: [{ model: CalibrationFormTemplate, as: 'plantilla', attributes: ['id', 'codigo', 'nombre', 'magnitud'] }],
  },
];

function formatearErroresAjv(errores) {
  return (errores || [])
    .map((e) => `${e.instancePath || '(raíz)'} ${e.message}`)
    .join('; ');
}

// Valida `data` contra el schema de la versión, en dos modos (tarea 3.2):
// - parcial (borrador): se ignora `required` de nivel superior, para
//   permitir guardar una captura incompleta a medio llenar; el resto de las
//   restricciones (type, minimum/maximum, patrón, etc.) SÍ se exige, así que
//   un valor fuera de rango se rechaza igual desde el primer guardado.
// - completo (confirmar): el schema tal cual fue definido, `required`
//   incluido — una entrada confirmada no puede quedar incompleta.
function validarData(schema, data, { parcial }) {
  const esquemaEfectivo = { ...schema };
  if (parcial) delete esquemaEfectivo.required;

  const validar = ajv.compile(esquemaEfectivo);
  const valido = validar(data);
  return { valido, motivo: valido ? null : formatearErroresAjv(validar.errors) };
}

// Crea una entrada nueva en borrador para un ítem de OT, usando una versión
// de plantilla específica (elegida por el usuario, igual que
// calibration_data_files.template_version_id en la tarea 2.3 — no hay un
// campo "magnitud" formal en ClientInstrument que permita resolverla sola).
exports.createEntry = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { form_template_version_id, data } = req.body;

    if (!form_template_version_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'form_template_version_id es obligatorio' },
      });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'data debe ser un objeto con los valores capturados' },
      });
    }

    const item = await WorkOrderItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem de la orden de trabajo no existe' },
      });
    }

    const version = await CalibrationFormTemplateVersion.findByPk(form_template_version_id);
    if (!version) {
      return res.status(400).json({
        success: false,
        error: { code: 'TEMPLATE_VERSION_NOT_FOUND', message: 'La versión de plantilla indicada no existe' },
      });
    }

    const validacion = validarData(version.schema, data, { parcial: true });
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: { code: 'DATA_OUT_OF_SCHEMA', message: `Datos fuera de rango o de tipo incorrecto: ${validacion.motivo}` },
      });
    }

    const entrada = await CalibrationFormEntry.create({
      work_order_item_id: item.id,
      form_template_version_id: version.id,
      data,
      estado: 'borrador',
      capturado_por: req.user.id,
      fecha_captura: new Date(),
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_form_entry',
      entidad_id: entrada.id,
      cambios_nuevos: { item_id: item.id, form_template_version_id: version.id },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_FORM_ENTRIES] Entrada creada para ítem ${item.id} por ${req.user.email}`);

    const entradaCompleta = await CalibrationFormEntry.findByPk(entrada.id, { include: ENTRY_INCLUDES });
    res.status(201).json({ success: true, message: 'Captura guardada en borrador', data: entradaCompleta });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_ENTRIES] Error creando entrada: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ENTRY_ERROR', message: 'Error guardando la captura' },
    });
  }
};

exports.getEntriesForItem = async (req, res) => {
  try {
    const entradas = await CalibrationFormEntry.findAll({
      where: { work_order_item_id: req.params.itemId },
      include: ENTRY_INCLUDES,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: entradas });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_ENTRIES] Error listando entradas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_ENTRIES_ERROR', message: 'Error obteniendo las capturas' },
    });
  }
};

// Actualiza los datos de una entrada mientras siga en borrador. Confirmado =
// inmutable, sin excepción (criterio de aceptación de la tarea 3.2).
exports.updateEntry = async (req, res) => {
  try {
    const entrada = await CalibrationFormEntry.findByPk(req.params.id, {
      include: [{ model: CalibrationFormTemplateVersion, as: 'versionPlantilla' }],
    });
    if (!entrada) {
      return res.status(404).json({
        success: false,
        error: { code: 'ENTRY_NOT_FOUND', message: 'La captura no existe' },
      });
    }
    if (entrada.estado !== 'borrador') {
      return res.status(403).json({
        success: false,
        error: { code: 'ENTRY_IMMUTABLE', message: 'Esta captura ya fue confirmada y no puede editarse' },
      });
    }

    const { data } = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'data debe ser un objeto con los valores capturados' },
      });
    }

    const validacion = validarData(entrada.versionPlantilla.schema, data, { parcial: true });
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: { code: 'DATA_OUT_OF_SCHEMA', message: `Datos fuera de rango o de tipo incorrecto: ${validacion.motivo}` },
      });
    }

    entrada.data = data;
    await entrada.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'calibration_form_entry',
      entidad_id: entrada.id,
      ip_address: req.ip,
    });

    const entradaCompleta = await CalibrationFormEntry.findByPk(entrada.id, { include: ENTRY_INCLUDES });
    res.json({ success: true, message: 'Captura actualizada', data: entradaCompleta });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_ENTRIES] Error actualizando entrada: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ENTRY_ERROR', message: 'Error actualizando la captura' },
    });
  }
};

// Confirma la entrada: revalida contra el schema COMPLETO (con `required`)
// — una captura incompleta no puede confirmarse — y a partir de aquí queda
// inmutable (bloqueada por el guardia de updateEntry) y auditada.
exports.confirmEntry = async (req, res) => {
  try {
    const entrada = await CalibrationFormEntry.findByPk(req.params.id, {
      include: [{ model: CalibrationFormTemplateVersion, as: 'versionPlantilla' }],
    });
    if (!entrada) {
      return res.status(404).json({
        success: false,
        error: { code: 'ENTRY_NOT_FOUND', message: 'La captura no existe' },
      });
    }
    if (entrada.estado === 'confirmado') {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_CONFIRMED', message: 'Esta captura ya está confirmada' },
      });
    }

    const validacion = validarData(entrada.versionPlantilla.schema, entrada.data, { parcial: false });
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: { code: 'DATA_INCOMPLETE', message: `No se puede confirmar: datos incompletos o fuera de rango: ${validacion.motivo}` },
      });
    }

    entrada.estado = 'confirmado';
    entrada.confirmado_por = req.user.id;
    entrada.fecha_confirmacion = new Date();
    await entrada.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'aprobar',
      entidad: 'calibration_form_entry',
      entidad_id: entrada.id,
      cambios_nuevos: { estado: 'confirmado' },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_FORM_ENTRIES] Entrada ${entrada.id} confirmada por ${req.user.email}`);

    const entradaCompleta = await CalibrationFormEntry.findByPk(entrada.id, { include: ENTRY_INCLUDES });
    res.json({ success: true, message: 'Captura confirmada correctamente', data: entradaCompleta });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_ENTRIES] Error confirmando entrada: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CONFIRM_ENTRY_ERROR', message: 'Error confirmando la captura' },
    });
  }
};
