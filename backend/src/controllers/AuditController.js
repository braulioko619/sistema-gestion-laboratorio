const { AuditLog, User } = require('../models');
const logger = require('../config/logger');

// Obtener logs de auditoría
exports.getAuditLogs = async (req, res) => {
  try {
    const { usuario_id, accion, entidad, fecha_inicio, fecha_fin, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (usuario_id) where.usuario_id = usuario_id;
    if (accion) where.accion = accion;
    if (entidad) where.entidad = entidad;
    if (fecha_inicio && fecha_fin) {
      where.timestamp = {
        [require('sequelize').Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      offset,
      limit: parseInt(limit),
      order: [['timestamp', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error(`[AUDIT] Error obteniendo logs: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_ERROR',
        message: 'Error obteniendo logs de auditoría',
      },
    });
  }
};

// Obtener log por ID
exports.getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [{ model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LOG_NOT_FOUND',
          message: 'Log no encontrado',
        },
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    logger.error(`[AUDIT] Error obteniendo log: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LOG_ERROR',
        message: 'Error obteniendo log',
      },
    });
  }
};

// Obtener resumen de auditoría
exports.getAuditSummary = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const logs = await AuditLog.findAll({
      where: {
        timestamp: {
          [require('sequelize').Op.gte]: fechaInicio,
        },
      },
    });

    const summary = {
      total_acciones: logs.length,
      por_accion: {},
      por_entidad: {},
      por_usuario: {},
    };

    logs.forEach(log => {
      summary.por_accion[log.accion] = (summary.por_accion[log.accion] || 0) + 1;
      summary.por_entidad[log.entidad] = (summary.por_entidad[log.entidad] || 0) + 1;
      summary.por_usuario[log.usuario_id] = (summary.por_usuario[log.usuario_id] || 0) + 1;
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error(`[AUDIT] Error obteniendo resumen: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SUMMARY_ERROR',
        message: 'Error obteniendo resumen de auditoría',
      },
    });
  }
};
