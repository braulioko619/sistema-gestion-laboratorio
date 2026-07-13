const { NonConformity, QualityRecord, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const INCLUDES = [
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'responsable', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'verificador', attributes: ['id', 'nombre', 'email'] },
  {
    model: QualityRecord,
    as: 'registro_origen',
    attributes: ['id', 'tipo_indicador', 'valor', 'unidad', 'estado_cumplimiento'],
  },
];

// Crear no conformidad
exports.createNonConformity = async (req, res) => {
  try {
    const {
      fuente,
      quality_record_id,
      descripcion,
      clasificacion,
      correccion_inmediata,
      decision_trabajo,
    } = req.body;

    if (!descripcion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La descripción es obligatoria',
        },
      });
    }

    const codigo = await NonConformity.generarCodigo();

    const nc = await NonConformity.create({
      codigo,
      fuente: fuente || 'otro',
      quality_record_id: quality_record_id || null,
      descripcion,
      clasificacion: clasificacion || 'menor',
      correccion_inmediata,
      decision_trabajo,
      estado: 'abierta',
      registrado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'non_conformity',
      entidad_id: nc.id,
      cambios_nuevos: { codigo, fuente: nc.fuente, clasificacion: nc.clasificacion, descripcion },
      ip_address: req.ip,
    });

    logger.info(`[NC] No conformidad creada: ${codigo} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `No conformidad ${codigo} registrada correctamente`,
      data: nc,
    });
  } catch (error) {
    logger.error(`[NC] Error creando no conformidad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_NC_ERROR',
        message: 'Error creando la no conformidad',
      },
    });
  }
};

// Listar no conformidades
exports.getNonConformities = async (req, res) => {
  try {
    const {
      estado,
      clasificacion,
      fuente,
      fecha_inicio,
      fecha_fin,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (clasificacion) where.clasificacion = clasificacion;
    if (fuente) where.fuente = fuente;
    if (fecha_inicio && fecha_fin) {
      where.createdAt = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      };
    }

    const { rows, count } = await NonConformity.findAndCountAll({
      where,
      include: INCLUDES,
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
    logger.error(`[NC] Error obteniendo no conformidades: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NC_ERROR',
        message: 'Error obteniendo no conformidades',
      },
    });
  }
};

// Obtener detalle de una no conformidad
exports.getNonConformityById = async (req, res) => {
  try {
    const nc = await NonConformity.findByPk(req.params.id, { include: INCLUDES });

    if (!nc) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NC_NOT_FOUND',
          message: 'La no conformidad no existe',
        },
      });
    }

    res.json({ success: true, data: nc });
  } catch (error) {
    logger.error(`[NC] Error obteniendo no conformidad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NC_ERROR',
        message: 'Error obteniendo la no conformidad',
      },
    });
  }
};

// Actualizar tratamiento (análisis de causa raíz, acción correctiva, responsable)
exports.updateNonConformity = async (req, res) => {
  try {
    const nc = await NonConformity.findByPk(req.params.id);

    if (!nc) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NC_NOT_FOUND',
          message: 'La no conformidad no existe',
        },
      });
    }

    if (nc.estado === 'cerrada') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NC_CLOSED',
          message: 'No se puede modificar una no conformidad cerrada',
        },
      });
    }

    const camposPermitidos = [
      'descripcion',
      'clasificacion',
      'correccion_inmediata',
      'decision_trabajo',
      'analisis_causa_raiz',
      'accion_correctiva',
      'responsable_id',
      'fecha_compromiso',
    ];

    const cambiosAnteriores = {};
    const cambiosNuevos = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== nc[campo]) {
        cambiosAnteriores[campo] = nc[campo];
        cambiosNuevos[campo] = req.body[campo];
        nc[campo] = req.body[campo];
      }
    });

    // Transición de estado: si ya hay análisis y acción definida, pasa a tratamiento
    if (nc.estado === 'abierta' && nc.analisis_causa_raiz && nc.accion_correctiva) {
      cambiosAnteriores.estado = 'abierta';
      nc.estado = 'en_tratamiento';
      cambiosNuevos.estado = 'en_tratamiento';
    }

    // El usuario puede enviar la NC a verificación cuando la acción está implementada
    if (req.body.estado === 'en_verificacion' && nc.estado === 'en_tratamiento') {
      cambiosAnteriores.estado = 'en_tratamiento';
      nc.estado = 'en_verificacion';
      cambiosNuevos.estado = 'en_verificacion';
    }

    await nc.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'non_conformity',
        entidad_id: nc.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[NC] No conformidad actualizada: ${nc.codigo} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'No conformidad actualizada correctamente',
      data: nc,
    });
  } catch (error) {
    logger.error(`[NC] Error actualizando no conformidad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_NC_ERROR',
        message: 'Error actualizando la no conformidad',
      },
    });
  }
};

// Verificar eficacia y cerrar (ISO 17025 8.7.1e)
exports.verifyNonConformity = async (req, res) => {
  try {
    const { verificacion_eficacia, eficaz } = req.body;

    if (!verificacion_eficacia || typeof eficaz !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Se requiere la evidencia de verificación y el resultado (eficaz: true/false)',
        },
      });
    }

    const nc = await NonConformity.findByPk(req.params.id);

    if (!nc) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NC_NOT_FOUND',
          message: 'La no conformidad no existe',
        },
      });
    }

    if (nc.estado === 'cerrada') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NC_CLOSED',
          message: 'La no conformidad ya está cerrada',
        },
      });
    }

    if (!nc.analisis_causa_raiz || !nc.accion_correctiva) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NC_INCOMPLETE',
          message: 'No se puede verificar sin análisis de causa raíz y acción correctiva registrados',
        },
      });
    }

    const estadoAnterior = nc.estado;
    nc.verificacion_eficacia = verificacion_eficacia;
    nc.eficaz = eficaz;
    nc.verificado_por = req.user.id;
    nc.fecha_verificacion = new Date();
    // Si la acción fue eficaz se cierra; si no, vuelve a tratamiento
    nc.estado = eficaz ? 'cerrada' : 'en_tratamiento';
    await nc.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: eficaz ? 'aprobar' : 'rechazar',
      entidad: 'non_conformity',
      entidad_id: nc.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: {
        estado: nc.estado,
        eficaz,
        verificacion_eficacia,
      },
      detalles: eficaz
        ? `Verificación de eficacia aprobada: NC ${nc.codigo} cerrada`
        : `Acción no eficaz: NC ${nc.codigo} vuelve a tratamiento`,
      ip_address: req.ip,
    });

    logger.info(
      `[NC] Verificación de eficacia de ${nc.codigo} (eficaz: ${eficaz}) por ${req.user.email}`
    );

    res.json({
      success: true,
      message: eficaz
        ? `No conformidad ${nc.codigo} cerrada: acción verificada como eficaz`
        : `Acción no eficaz: ${nc.codigo} vuelve a tratamiento`,
      data: nc,
    });
  } catch (error) {
    logger.error(`[NC] Error verificando no conformidad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFY_NC_ERROR',
        message: 'Error verificando la no conformidad',
      },
    });
  }
};

// Resumen de no conformidades (KPIs)
exports.getNonConformitySummary = async (req, res) => {
  try {
    const ncs = await NonConformity.findAll();
    const hoy = new Date().toISOString().split('T')[0];

    const abiertas = ncs.filter((nc) => nc.estado !== 'cerrada');
    const cerradas = ncs.filter((nc) => nc.estado === 'cerrada');
    const vencidas = abiertas.filter(
      (nc) => nc.fecha_compromiso && nc.fecha_compromiso < hoy
    );

    // Tiempo medio de cierre en días
    let tiempoMedioCierre = null;
    if (cerradas.length > 0) {
      const totalDias = cerradas.reduce((acc, nc) => {
        const dias =
          (new Date(nc.fecha_verificacion || nc.updatedAt) - new Date(nc.createdAt)) /
          (1000 * 60 * 60 * 24);
        return acc + dias;
      }, 0);
      tiempoMedioCierre = (totalDias / cerradas.length).toFixed(1);
    }

    res.json({
      success: true,
      data: {
        total: ncs.length,
        por_estado: {
          abierta: ncs.filter((nc) => nc.estado === 'abierta').length,
          en_tratamiento: ncs.filter((nc) => nc.estado === 'en_tratamiento').length,
          en_verificacion: ncs.filter((nc) => nc.estado === 'en_verificacion').length,
          cerrada: cerradas.length,
        },
        por_clasificacion: {
          menor: ncs.filter((nc) => nc.clasificacion === 'menor').length,
          mayor: ncs.filter((nc) => nc.clasificacion === 'mayor').length,
          critica: ncs.filter((nc) => nc.clasificacion === 'critica').length,
        },
        vencidas: vencidas.length,
        tiempo_medio_cierre_dias: tiempoMedioCierre,
      },
    });
  } catch (error) {
    logger.error(`[NC] Error obteniendo resumen: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NC_SUMMARY_ERROR',
        message: 'Error obteniendo el resumen de no conformidades',
      },
    });
  }
};
