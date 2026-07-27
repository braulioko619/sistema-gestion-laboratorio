const { Op } = require('sequelize');
const Ajv = require('ajv');
const { CalibrationFormTemplate, CalibrationFormTemplateVersion, User, AuditLog, sequelize } = require('../models');
const logger = require('../config/logger');

// strict:false porque el proyecto usa una convención propia de anotar la
// unidad de cada campo directamente en su schema (ej. `{ type: 'number',
// unidad: 'kg' }`) para que el formulario dinámico (tarea 3.2) pueda
// renderizar la unidad sin duplicar esa información fuera del JSON Schema;
// en modo estricto (default de Ajv v8) esa palabra clave desconocida haría
// fallar la compilación de cualquier schema legítimo del proyecto.
const ajv = new Ajv({ strict: false, allErrors: true });

const VERSION_INCLUDES = [
  { model: User, as: 'creadoPor', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'aprobadoPor', attributes: ['id', 'nombre', 'email'] },
];

const TEMPLATE_INCLUDES = [
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  {
    model: CalibrationFormTemplateVersion,
    as: 'versiones',
    include: VERSION_INCLUDES,
  },
];

// Valida que `schema` sea un JSON Schema compilable por ajv Y que describa
// un objeto (una entrada de formulario de calibración es siempre un objeto
// campo->valor, nunca un string/array/número suelto en la raíz) — tarea 3.1,
// criterio de aceptación "schema inválido rechazado (ajv)".
function validarJsonSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return { valido: false, motivo: 'El schema debe ser un objeto JSON Schema' };
  }
  if (schema.type !== 'object') {
    return { valido: false, motivo: 'El schema debe describir un objeto (type: "object"): una entrada de formulario es un conjunto de campos' };
  }
  try {
    ajv.compile(schema);
  } catch (error) {
    return { valido: false, motivo: `JSON Schema inválido: ${error.message}` };
  }
  return { valido: true };
}

// Crear una plantilla (nace en borrador, sin versiones)
exports.createTemplate = async (req, res) => {
  try {
    const { codigo, nombre, magnitud, descripcion } = req.body;

    if (!codigo || !nombre || !magnitud) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Código, nombre y magnitud son obligatorios' },
      });
    }

    const existe = await CalibrationFormTemplate.findOne({ where: { codigo } });
    if (existe) {
      return res.status(409).json({
        success: false,
        error: { code: 'TEMPLATE_CODE_EXISTS', message: `Ya existe una plantilla de formulario con el código ${codigo}` },
      });
    }

    const plantilla = await CalibrationFormTemplate.create({
      codigo,
      nombre,
      magnitud,
      descripcion: descripcion || null,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_form_template',
      entidad_id: plantilla.id,
      cambios_nuevos: { codigo, nombre, magnitud },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_FORM_TEMPLATES] Plantilla ${codigo} creada por ${req.user.email}`);

    res.status(201).json({ success: true, message: 'Plantilla de formulario registrada correctamente', data: plantilla });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_TEMPLATES] Error creando plantilla: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_TEMPLATE_ERROR', message: 'Error registrando la plantilla' },
    });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const { magnitud, estado, search } = req.query;
    const where = {};
    if (magnitud) where.magnitud = magnitud;
    if (estado) where.estado = estado;
    if (search) {
      where[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { nombre: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const plantillas = await CalibrationFormTemplate.findAll({
      where,
      include: TEMPLATE_INCLUDES,
      order: [['magnitud', 'ASC'], ['codigo', 'ASC']],
    });

    res.json({ success: true, data: plantillas });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_TEMPLATES] Error listando plantillas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_TEMPLATES_ERROR', message: 'Error obteniendo las plantillas' },
    });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const plantilla = await CalibrationFormTemplate.findByPk(req.params.id, { include: TEMPLATE_INCLUDES });
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    res.json({ success: true, data: plantilla });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_TEMPLATES] Error obteniendo plantilla: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_TEMPLATE_ERROR', message: 'Error obteniendo la plantilla' },
    });
  }
};

// Crea una nueva versión con su JSON Schema (no queda vigente
// automáticamente: hay que marcarla vigente explícitamente, igual que en
// plantillas Excel — tarea 2.1).
exports.createVersion = async (req, res) => {
  try {
    const { version, schema, cambios } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'La versión es obligatoria (ej: 1.0)' },
      });
    }

    const validacion = validarJsonSchema(schema);
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SCHEMA', message: validacion.motivo },
      });
    }

    const plantilla = await CalibrationFormTemplate.findByPk(req.params.id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    if (plantilla.estado === 'obsoleta') {
      return res.status(400).json({
        success: false,
        error: { code: 'TEMPLATE_OBSOLETE', message: 'No se pueden crear versiones para una plantilla obsoleta' },
      });
    }

    const yaExiste = await CalibrationFormTemplateVersion.findOne({ where: { template_id: plantilla.id, version } });
    if (yaExiste) {
      return res.status(409).json({
        success: false,
        error: { code: 'VERSION_EXISTS', message: `Ya existe la versión ${version} para esta plantilla` },
      });
    }

    const nuevaVersion = await CalibrationFormTemplateVersion.create({
      template_id: plantilla.id,
      version,
      schema,
      cambios: cambios || null,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_form_template_version',
      entidad_id: nuevaVersion.id,
      cambios_nuevos: { plantilla: plantilla.codigo, version },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_FORM_TEMPLATES] Versión ${version} creada para ${plantilla.codigo} por ${req.user.email}`);

    const versionCompleta = await CalibrationFormTemplateVersion.findByPk(nuevaVersion.id, { include: VERSION_INCLUDES });
    res.status(201).json({ success: true, message: 'Versión creada correctamente', data: versionCompleta });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_TEMPLATES] Error creando versión: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_VERSION_ERROR', message: 'Error creando la versión' },
    });
  }
};

// Marca una versión como vigente: desmarca la anterior (si existía) en la
// misma transacción y actualiza el estado de la plantilla. El índice único
// parcial en BD es la red de seguridad ante condiciones de carrera.
exports.marcarVersionVigente = async (req, res) => {
  try {
    const { id, versionId } = req.params;

    const plantilla = await CalibrationFormTemplate.findByPk(id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    if (plantilla.estado === 'obsoleta') {
      return res.status(400).json({
        success: false,
        error: { code: 'TEMPLATE_OBSOLETE', message: 'No se puede activar una versión de una plantilla obsoleta' },
      });
    }

    const version = await CalibrationFormTemplateVersion.findOne({ where: { id: versionId, template_id: id } });
    if (!version) {
      return res.status(404).json({
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'La versión no existe para esta plantilla' },
      });
    }
    if (version.vigente) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_CURRENT', message: 'Esta versión ya es la vigente' },
      });
    }

    await sequelize.transaction(async (t) => {
      await CalibrationFormTemplateVersion.update(
        { vigente: false },
        { where: { template_id: id, vigente: true }, transaction: t }
      );

      version.vigente = true;
      version.aprobado_por = req.user.id;
      version.fecha_aprobacion = new Date();
      await version.save({ transaction: t });

      if (plantilla.estado !== 'vigente') {
        plantilla.estado = 'vigente';
        await plantilla.save({ transaction: t });
      }
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'aprobar',
      entidad: 'calibration_form_template_version',
      entidad_id: version.id,
      cambios_nuevos: { plantilla: plantilla.codigo, version: version.version },
      detalles: `Versión ${version.version} marcada vigente para ${plantilla.codigo}`,
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_FORM_TEMPLATES] Versión ${version.version} de ${plantilla.codigo} marcada vigente por ${req.user.email}`);

    const versionCompleta = await CalibrationFormTemplateVersion.findByPk(version.id, { include: VERSION_INCLUDES });
    res.json({ success: true, message: 'Versión marcada como vigente', data: versionCompleta });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_TEMPLATES] Error marcando versión vigente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'MARK_CURRENT_ERROR', message: 'Error marcando la versión como vigente' },
    });
  }
};

// Obsoleta la plantilla completa: ninguna de sus versiones queda vigente.
exports.obsoletarTemplate = async (req, res) => {
  try {
    const plantilla = await CalibrationFormTemplate.findByPk(req.params.id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    if (plantilla.estado === 'obsoleta') {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_OBSOLETE', message: 'Esta plantilla ya está obsoleta' },
      });
    }

    const estadoAnterior = plantilla.estado;

    await sequelize.transaction(async (t) => {
      await CalibrationFormTemplateVersion.update(
        { vigente: false },
        { where: { template_id: plantilla.id, vigente: true }, transaction: t }
      );
      plantilla.estado = 'obsoleta';
      await plantilla.save({ transaction: t });
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'archivar',
      entidad: 'calibration_form_template',
      entidad_id: plantilla.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado: 'obsoleta' },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_FORM_TEMPLATES] Plantilla ${plantilla.codigo} obsoletada por ${req.user.email}`);

    res.json({ success: true, message: 'Plantilla marcada como obsoleta', data: plantilla });
  } catch (error) {
    logger.error(`[CALIBRATION_FORM_TEMPLATES] Error obsoletando plantilla: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'OBSOLETE_TEMPLATE_ERROR', message: 'Error marcando la plantilla como obsoleta' },
    });
  }
};
