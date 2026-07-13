const {
  InternalAudit,
  AuditFinding,
  NonConformity,
  User,
  AuditLog,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const AUDIT_INCLUDES = [
  { model: User, as: 'auditor', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
];

// Planificar auditoría interna
exports.createAudit = async (req, res) => {
  try {
    const { alcance, criterios, auditor_id, auditor_externo, fecha_planificada } = req.body;

    if (!alcance || !fecha_planificada) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El alcance y la fecha planificada son obligatorios',
        },
      });
    }

    if (!auditor_id && !auditor_externo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Debe indicarse un auditor interno o externo',
        },
      });
    }

    const codigo = await InternalAudit.generarCodigo();

    const auditoria = await InternalAudit.create({
      codigo,
      alcance,
      criterios,
      auditor_id: auditor_id || null,
      auditor_externo,
      fecha_planificada,
      estado: 'planificada',
      registrado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'internal_audit',
      entidad_id: auditoria.id,
      cambios_nuevos: { codigo, alcance, fecha_planificada },
      ip_address: req.ip,
    });

    logger.info(`[IAUDIT] Auditoría interna ${codigo} planificada por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Auditoría ${codigo} planificada`,
      data: auditoria,
    });
  } catch (error) {
    logger.error(`[IAUDIT] Error creando auditoría: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_AUDIT_ERROR',
        message: 'Error planificando la auditoría',
      },
    });
  }
};

// Listar auditorías (programa)
exports.getAudits = async (req, res) => {
  try {
    const { estado, anio, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (anio) {
      where.fecha_planificada = {
        [Op.between]: [`${anio}-01-01`, `${anio}-12-31`],
      };
    }

    const { rows, count } = await InternalAudit.findAndCountAll({
      where,
      include: [
        ...AUDIT_INCLUDES,
        { model: AuditFinding, as: 'hallazgos', attributes: ['id', 'tipo'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['fecha_planificada', 'DESC']],
      distinct: true,
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
    logger.error(`[IAUDIT] Error listando auditorías: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDITS_ERROR',
        message: 'Error obteniendo auditorías',
      },
    });
  }
};

// Detalle con hallazgos
exports.getAuditById = async (req, res) => {
  try {
    const auditoria = await InternalAudit.findByPk(req.params.id, {
      include: [
        ...AUDIT_INCLUDES,
        {
          model: AuditFinding,
          as: 'hallazgos',
          include: [
            {
              model: NonConformity,
              as: 'no_conformidad',
              attributes: ['id', 'codigo', 'estado'],
            },
            { model: User, as: 'registrador', attributes: ['id', 'nombre'] },
          ],
        },
      ],
      order: [[{ model: AuditFinding, as: 'hallazgos' }, 'createdAt', 'ASC']],
    });

    if (!auditoria) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUDIT_NOT_FOUND',
          message: 'La auditoría no existe',
        },
      });
    }

    res.json({ success: true, data: auditoria });
  } catch (error) {
    logger.error(`[IAUDIT] Error obteniendo auditoría: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_ERROR',
        message: 'Error obteniendo la auditoría',
      },
    });
  }
};

// Actualizar auditoría (estado, fechas, conclusiones)
exports.updateAudit = async (req, res) => {
  try {
    const auditoria = await InternalAudit.findByPk(req.params.id);

    if (!auditoria) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUDIT_NOT_FOUND',
          message: 'La auditoría no existe',
        },
      });
    }

    if (['completada', 'cancelada'].includes(auditoria.estado)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'AUDIT_CLOSED',
          message: 'No se puede modificar una auditoría completada o cancelada',
        },
      });
    }

    // Cerrar exige conclusiones y fecha de realización (evidencia 8.8.2)
    if (req.body.estado === 'completada') {
      const conclusiones = req.body.conclusiones || auditoria.conclusiones;
      const fechaReal = req.body.fecha_realizacion || auditoria.fecha_realizacion;
      if (!conclusiones || !fechaReal) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'AUDIT_INCOMPLETE',
            message:
              'Para completar la auditoría se requieren la fecha de realización y las conclusiones',
          },
        });
      }
    }

    const camposPermitidos = [
      'alcance',
      'criterios',
      'auditor_id',
      'auditor_externo',
      'fecha_planificada',
      'fecha_realizacion',
      'conclusiones',
      'estado',
    ];

    const cambiosAnteriores = {};
    const cambiosNuevos = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== auditoria[campo]) {
        cambiosAnteriores[campo] = auditoria[campo];
        cambiosNuevos[campo] = req.body[campo];
        auditoria[campo] = req.body[campo];
      }
    });

    await auditoria.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'internal_audit',
        entidad_id: auditoria.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[IAUDIT] Auditoría ${auditoria.codigo} actualizada por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Auditoría actualizada',
      data: auditoria,
    });
  } catch (error) {
    logger.error(`[IAUDIT] Error actualizando auditoría: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_AUDIT_ERROR',
        message: 'Error actualizando la auditoría',
      },
    });
  }
};

// Registrar hallazgo (NC automática si tipo = no_conformidad)
exports.createFinding = async (req, res) => {
  try {
    const { tipo, clausula, descripcion } = req.body;

    if (!tipo || !descripcion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El tipo y la descripción del hallazgo son obligatorios',
        },
      });
    }

    const auditoria = await InternalAudit.findByPk(req.params.id);
    if (!auditoria) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUDIT_NOT_FOUND',
          message: 'La auditoría no existe',
        },
      });
    }

    if (['completada', 'cancelada'].includes(auditoria.estado)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'AUDIT_CLOSED',
          message: 'No se pueden agregar hallazgos a una auditoría cerrada',
        },
      });
    }

    // La auditoría pasa a en_curso al registrar el primer hallazgo
    if (auditoria.estado === 'planificada') {
      auditoria.estado = 'en_curso';
      await auditoria.save();
    }

    let noConformidad = null;
    if (tipo === 'no_conformidad') {
      const codigoNC = await NonConformity.generarCodigo();
      noConformidad = await NonConformity.create({
        codigo: codigoNC,
        fuente: 'auditoria_interna',
        descripcion: `[${auditoria.codigo}${clausula ? ` · cláusula ${clausula}` : ''}] ${descripcion}`,
        clasificacion: req.body.clasificacion || 'menor',
        estado: 'abierta',
        registrado_por: req.user.id,
      });

      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'crear',
        entidad: 'non_conformity',
        entidad_id: noConformidad.id,
        cambios_nuevos: {
          codigo: codigoNC,
          fuente: 'auditoria_interna',
          auditoria: auditoria.codigo,
          origen: 'automatico',
        },
        ip_address: req.ip,
      });

      logger.info(`[NC] NC ${codigoNC} generada desde hallazgo de ${auditoria.codigo}`);
    }

    const hallazgo = await AuditFinding.create({
      audit_id: auditoria.id,
      tipo,
      clausula,
      descripcion,
      non_conformity_id: noConformidad ? noConformidad.id : null,
      registrado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'audit_finding',
      entidad_id: hallazgo.id,
      cambios_nuevos: { auditoria: auditoria.codigo, tipo, clausula, descripcion },
      ip_address: req.ip,
    });

    logger.info(
      `[IAUDIT] Hallazgo ${tipo} registrado en ${auditoria.codigo} por ${req.user.email}`
    );

    res.status(201).json({
      success: true,
      message: noConformidad
        ? `Hallazgo registrado. Se generó la NC ${noConformidad.codigo}`
        : 'Hallazgo registrado',
      data: hallazgo,
      no_conformidad: noConformidad,
    });
  } catch (error) {
    logger.error(`[IAUDIT] Error registrando hallazgo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FINDING_ERROR',
        message: 'Error registrando el hallazgo',
      },
    });
  }
};

// Resumen del programa
exports.getAuditSummary = async (req, res) => {
  try {
    const anio = parseInt(req.query.anio || new Date().getFullYear());

    const auditorias = await InternalAudit.findAll({
      where: {
        fecha_planificada: {
          [Op.between]: [`${anio}-01-01`, `${anio}-12-31`],
        },
      },
      include: [{ model: AuditFinding, as: 'hallazgos', attributes: ['id', 'tipo'] }],
    });

    const hallazgos = auditorias.flatMap((a) => a.hallazgos || []);

    res.json({
      success: true,
      data: {
        anio,
        total: auditorias.length,
        por_estado: {
          planificada: auditorias.filter((a) => a.estado === 'planificada').length,
          en_curso: auditorias.filter((a) => a.estado === 'en_curso').length,
          completada: auditorias.filter((a) => a.estado === 'completada').length,
          cancelada: auditorias.filter((a) => a.estado === 'cancelada').length,
        },
        hallazgos: {
          total: hallazgos.length,
          no_conformidades: hallazgos.filter((h) => h.tipo === 'no_conformidad').length,
          observaciones: hallazgos.filter((h) => h.tipo === 'observacion').length,
          oportunidades_mejora: hallazgos.filter((h) => h.tipo === 'oportunidad_mejora')
            .length,
        },
      },
    });
  } catch (error) {
    logger.error(`[IAUDIT] Error obteniendo resumen: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SUMMARY_ERROR',
        message: 'Error obteniendo el resumen del programa',
      },
    });
  }
};
