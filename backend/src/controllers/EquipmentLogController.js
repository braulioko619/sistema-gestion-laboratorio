const { Equipment, EquipmentLogEntry, User, AuditLog } = require('../models');
const logger = require('../config/logger');

const LOG_INCLUDES = [
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  {
    model: EquipmentLogEntry,
    as: 'entradaCorregida',
    attributes: ['id', 'fecha', 'tipo', 'descripcion'],
  },
];

const TIPOS_VALIDOS = new Set([
  'uso',
  'incidencia',
  'traslado',
  'mantenimiento_correctivo',
  'cambio_estado',
  'observacion',
  'correccion',
  'otro',
]);

// Bitácora del instrumento con control de cambio: cada entrada es inmutable
// (sin update/delete expuestos). Una corrección se registra como una entrada
// nueva que referencia, vía corrige_entrada_id, a la entrada que corrige.
exports.createLogEntry = async (req, res) => {
  try {
    const { fecha, tipo, descripcion, estado_resultante, corrige_entrada_id } = req.body;

    if (!fecha || !tipo || !descripcion) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'fecha, tipo y descripcion son obligatorios' },
      });
    }
    if (!TIPOS_VALIDOS.has(tipo)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `tipo debe ser una de: ${[...TIPOS_VALIDOS].join(', ')}` },
      });
    }

    const equipo = await Equipment.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El equipo no existe' },
      });
    }

    if (corrige_entrada_id) {
      const entradaPrevia = await EquipmentLogEntry.findByPk(corrige_entrada_id);
      if (!entradaPrevia || entradaPrevia.equipment_id !== equipo.id) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'corrige_entrada_id debe referenciar una entrada de bitácora existente de este mismo equipo' },
        });
      }
    }

    const entrada = await EquipmentLogEntry.create({
      equipment_id: equipo.id,
      fecha,
      tipo,
      descripcion,
      estado_resultante: estado_resultante || null,
      corrige_entrada_id: corrige_entrada_id || null,
      registrado_por: req.user.id,
    });

    if (estado_resultante && estado_resultante !== equipo.estado) {
      equipo.estado = estado_resultante;
      await equipo.save();
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'equipment_log_entry',
      entidad_id: entrada.id,
      cambios_nuevos: { equipo: equipo.codigo, tipo, fecha, corrige_entrada_id: corrige_entrada_id || null },
      ip_address: req.ip,
    });

    logger.info(`[EQUIPMENT_LOG] Entrada de bitácora (${tipo}) registrada para ${equipo.codigo} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Entrada de bitácora registrada correctamente',
      data: entrada,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT_LOG] Error registrando entrada de bitácora: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_LOG_ENTRY_ERROR', message: 'Error registrando la entrada de bitácora' },
    });
  }
};

exports.listLogEntries = async (req, res) => {
  try {
    const entradas = await EquipmentLogEntry.findAll({
      where: { equipment_id: req.params.id },
      include: LOG_INCLUDES,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, data: entradas });
  } catch (error) {
    logger.error(`[EQUIPMENT_LOG] Error listando bitácora: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_LOG_ENTRIES_ERROR', message: 'Error obteniendo la bitácora' },
    });
  }
};
