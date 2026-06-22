const { QualityRecord, User, AuditLog } = require('../models');
const logger = require('../config/logger');

// Crear registro de calidad
exports.createQualityRecord = async (req, res) => {
  try {
    const { tipo_indicador, valor, unidad, limite_minimo, limite_maximo, notas } = req.body;

    // Determinar estado de cumplimiento
    let estado_cumplimiento = 'conforme';
    if (limite_minimo && valor < limite_minimo) {
      estado_cumplimiento = 'no_conforme';
    } else if (limite_maximo && valor > limite_maximo) {
      estado_cumplimiento = 'no_conforme';
    } else if (
      (limite_minimo && valor < limite_minimo * 1.1) ||
      (limite_maximo && valor > limite_maximo * 0.9)
    ) {
      estado_cumplimiento = 'alerta';
    }

    const record = await QualityRecord.create({
      tipo_indicador,
      valor,
      unidad,
      limite_minimo,
      limite_maximo,
      estado_cumplimiento,
      notas,
      registrado_por: req.user.id,
    });

    // Registrar auditoría
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'quality_record',
      entidad_id: record.id,
      cambios_nuevos: { tipo_indicador, valor, estado_cumplimiento },
      ip_address: req.ip,
    });

    logger.info(`[QUALITY] Registro de calidad creado: ${record.id} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Registro de calidad creado correctamente',
      data: record,
    });
  } catch (error) {
    logger.error(`[QUALITY] Error creando registro: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_QUALITY_ERROR',
        message: 'Error creando registro de calidad',
      },
    });
  }
};

// Obtener registros de calidad
exports.getQualityRecords = async (req, res) => {
  try {
    const { tipo_indicador, estado_cumplimiento, fecha_inicio, fecha_fin, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (tipo_indicador) where.tipo_indicador = tipo_indicador;
    if (estado_cumplimiento) where.estado_cumplimiento = estado_cumplimiento;
    if (fecha_inicio && fecha_fin) {
      where.createdAt = {
        [require('sequelize').Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    const { rows, count } = await QualityRecord.findAndCountAll({
      where,
      include: [{ model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] }],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
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
    logger.error(`[QUALITY] Error obteniendo registros: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_QUALITY_ERROR',
        message: 'Error obteniendo registros de calidad',
      },
    });
  }
};

// Obtener resumen de calidad
exports.getQualitySummary = async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const records = await QualityRecord.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: fechaInicio,
        },
      },
    });

    const summary = {
      total: records.length,
      conforme: records.filter(r => r.estado_cumplimiento === 'conforme').length,
      alerta: records.filter(r => r.estado_cumplimiento === 'alerta').length,
      no_conforme: records.filter(r => r.estado_cumplimiento === 'no_conforme').length,
      porcentaje_conformidad: ((records.filter(r => r.estado_cumplimiento === 'conforme').length / records.length) * 100).toFixed(2),
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error(`[QUALITY] Error obteniendo resumen: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SUMMARY_ERROR',
        message: 'Error obteniendo resumen de calidad',
      },
    });
  }
};
