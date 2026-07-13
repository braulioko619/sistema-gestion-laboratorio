const { QualityRecord, QualityIndicator, NonConformity, User, AuditLog } = require('../models');
const logger = require('../config/logger');

// Crear registro de calidad
exports.createQualityRecord = async (req, res) => {
  try {
    const { tipo_indicador, notas } = req.body;
    let { valor, unidad, limite_minimo, limite_maximo } = req.body;

    valor = parseFloat(valor);
    if (Number.isNaN(valor)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El valor debe ser numérico',
        },
      });
    }

    // Los límites oficiales vienen de la definición del indicador en BD;
    // los del body solo se usan si el indicador no está catalogado.
    const indicador = await QualityIndicator.findOne({
      where: { tipo_indicador },
    });
    if (indicador) {
      limite_minimo = indicador.limite_minimo;
      limite_maximo = indicador.limite_maximo;
      unidad = indicador.unidad;
    }

    // Determinar estado de cumplimiento (!= null para no ignorar límites en 0)
    let estado_cumplimiento = 'conforme';
    if (limite_minimo != null && valor < limite_minimo) {
      estado_cumplimiento = 'no_conforme';
    } else if (limite_maximo != null && valor > limite_maximo) {
      estado_cumplimiento = 'no_conforme';
    } else if (
      (limite_minimo != null && valor < limite_minimo * 1.1) ||
      (limite_maximo != null && valor > limite_maximo * 0.9)
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

    // ISO 17025 7.10: todo resultado fuera de límites genera una no conformidad
    // vinculada automáticamente para asegurar su tratamiento.
    let noConformidad = null;
    if (estado_cumplimiento === 'no_conforme') {
      try {
        const codigo = await NonConformity.generarCodigo();
        noConformidad = await NonConformity.create({
          codigo,
          fuente: 'registro_calidad',
          quality_record_id: record.id,
          descripcion: `Indicador "${tipo_indicador}" fuera de límites: valor ${valor}${unidad ? ' ' + unidad : ''} (límites: ${limite_minimo ?? 'N/A'} - ${limite_maximo ?? 'N/A'}).`,
          clasificacion: 'menor',
          estado: 'abierta',
          registrado_por: req.user.id,
        });

        await AuditLog.create({
          usuario_id: req.user.id,
          accion: 'crear',
          entidad: 'non_conformity',
          entidad_id: noConformidad.id,
          cambios_nuevos: {
            codigo,
            fuente: 'registro_calidad',
            quality_record_id: record.id,
            origen: 'automatico',
          },
          ip_address: req.ip,
        });

        logger.info(`[NC] No conformidad automática ${codigo} generada desde registro ${record.id}`);
      } catch (ncError) {
        // La falla al crear la NC no debe impedir el registro de calidad
        logger.error(`[NC] Error creando NC automática: ${ncError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: noConformidad
        ? `Registro creado. Se generó automáticamente la no conformidad ${noConformidad.codigo}`
        : 'Registro de calidad creado correctamente',
      data: record,
      no_conformidad: noConformidad,
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

// Obtener catálogo de indicadores
exports.getQualityIndicators = async (req, res) => {
  try {
    const indicadores = await QualityIndicator.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']],
    });

    res.json({
      success: true,
      data: indicadores.map((ind) => ({
        id: ind.tipo_indicador,
        nombre: ind.nombre,
        unidad: ind.unidad,
        limites: {
          minimo: ind.limite_minimo,
          maximo: ind.limite_maximo,
        },
        tipo: 'numerico',
      })),
    });
  } catch (error) {
    logger.error(`[QUALITY] Error obteniendo indicadores: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_INDICATORS_ERROR',
        message: 'Error obteniendo indicadores de calidad',
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
