const {
  PersonnelRecord,
  PersonnelAuthorization,
  User,
  Role,
  AuditLog,
} = require('../models');
const { Op } = require('sequelize');
const PersonnelAuthorizationService = require('../services/PersonnelAuthorizationService');
const logger = require('../config/logger');

const DIAS_ALERTA = 60;

// Listar personal con resumen de expediente
exports.getPersonnel = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      where: { estado: 'activo' },
      attributes: ['id', 'nombre', 'apellido', 'email'],
      include: [{ model: Role, as: 'rol', attributes: ['nombre'] }],
      order: [['nombre', 'ASC']],
    });

    const [records, auths] = await Promise.all([
      PersonnelRecord.findAll({
        attributes: ['user_id', 'tipo'],
      }),
      PersonnelAuthorization.findAll({
        attributes: ['user_id', 'estado'],
      }),
    ]);

    const data = usuarios.map((u) => {
      const recs = records.filter((r) => r.user_id === u.id);
      const auts = auths.filter((a) => a.user_id === u.id);
      return {
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        rol: u.rol ? u.rol.nombre : null,
        registros: recs.length,
        evaluaciones_competencia: recs.filter(
          (r) => r.tipo === 'evaluacion_competencia'
        ).length,
        autorizaciones_vigentes: auts.filter((a) => a.estado === 'vigente').length,
        sin_evaluacion: recs.filter((r) => r.tipo === 'evaluacion_competencia').length === 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    logger.error(`[PERSONNEL] Error listando personal: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PERSONNEL_ERROR',
        message: 'Error obteniendo el personal',
      },
    });
  }
};

// Expediente completo de una persona
exports.getPersonnelByUserId = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.userId, {
      attributes: ['id', 'nombre', 'apellido', 'email'],
      include: [{ model: Role, as: 'rol', attributes: ['nombre'] }],
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'El usuario no existe',
        },
      });
    }

    const [registros, autorizaciones] = await Promise.all([
      PersonnelRecord.findAll({
        where: { user_id: usuario.id },
        include: [
          { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
        ],
        order: [['fecha', 'DESC']],
      }),
      PersonnelAuthorization.findAll({
        where: { user_id: usuario.id },
        include: [
          { model: User, as: 'autorizador', attributes: ['id', 'nombre', 'email'] },
        ],
        order: [['fecha_autorizacion', 'DESC']],
      }),
    ]);

    res.json({
      success: true,
      data: {
        usuario,
        registros,
        autorizaciones,
      },
    });
  } catch (error) {
    logger.error(`[PERSONNEL] Error obteniendo expediente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PERSONNEL_ERROR',
        message: 'Error obteniendo el expediente',
      },
    });
  }
};

// Agregar registro al expediente
exports.createPersonnelRecord = async (req, res) => {
  try {
    const {
      tipo,
      descripcion,
      institucion,
      fecha,
      fecha_vencimiento,
      referencia_certificado,
      resultado,
      observaciones,
    } = req.body;

    if (!tipo || !descripcion || !fecha) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tipo, descripción y fecha son obligatorios',
        },
      });
    }

    const usuario = await User.findByPk(req.params.userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'El usuario no existe',
        },
      });
    }

    const registro = await PersonnelRecord.create({
      user_id: usuario.id,
      tipo,
      descripcion,
      institucion,
      fecha,
      fecha_vencimiento: fecha_vencimiento || null,
      referencia_certificado,
      resultado: resultado || null,
      observaciones,
      registrado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'personnel_record',
      entidad_id: registro.id,
      cambios_nuevos: { persona: usuario.email, tipo, descripcion, fecha },
      ip_address: req.ip,
    });

    logger.info(
      `[PERSONNEL] Registro ${tipo} agregado a ${usuario.email} por ${req.user.email}`
    );

    res.status(201).json({
      success: true,
      message: 'Registro agregado al expediente',
      data: registro,
    });
  } catch (error) {
    logger.error(`[PERSONNEL] Error creando registro: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_RECORD_ERROR',
        message: 'Error agregando el registro',
      },
    });
  }
};

// Otorgar autorización (6.2.6)
exports.createAuthorization = async (req, res) => {
  try {
    const { actividad, magnitud, alcance, fecha_autorizacion, fecha_vencimiento, observaciones } =
      req.body;

    if (!actividad || !fecha_autorizacion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'La actividad y la fecha de autorización son obligatorias',
        },
      });
    }

    const usuario = await User.findByPk(req.params.userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'El usuario no existe',
        },
      });
    }

    const autorizacion = await PersonnelAuthorization.create({
      user_id: usuario.id,
      actividad,
      magnitud: magnitud || null,
      alcance,
      autorizado_por: req.user.id,
      fecha_autorizacion,
      fecha_vencimiento: fecha_vencimiento || null,
      estado: 'vigente',
      observaciones,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'aprobar',
      entidad: 'personnel_authorization',
      entidad_id: autorizacion.id,
      cambios_nuevos: { persona: usuario.email, actividad, fecha_autorizacion },
      detalles: `Autorización otorgada a ${usuario.email} para: ${actividad}`,
      ip_address: req.ip,
    });

    logger.info(
      `[PERSONNEL] Autorización "${actividad}" otorgada a ${usuario.email} por ${req.user.email}`
    );

    res.status(201).json({
      success: true,
      message: 'Autorización otorgada',
      data: autorizacion,
    });
  } catch (error) {
    logger.error(`[PERSONNEL] Error creando autorización: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_AUTH_ERROR',
        message: 'Error otorgando la autorización',
      },
    });
  }
};

// Revocar autorización
exports.revokeAuthorization = async (req, res) => {
  try {
    const autorizacion = await PersonnelAuthorization.findByPk(req.params.id, {
      include: [{ model: User, as: 'persona', attributes: ['id', 'email'] }],
    });

    if (!autorizacion) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_NOT_FOUND',
          message: 'La autorización no existe',
        },
      });
    }

    if (autorizacion.estado === 'revocada') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_REVOKED',
          message: 'La autorización ya está revocada',
        },
      });
    }

    const estadoAnterior = autorizacion.estado;
    autorizacion.estado = 'revocada';
    if (req.body.observaciones) {
      autorizacion.observaciones = req.body.observaciones;
    }
    await autorizacion.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'rechazar',
      entidad: 'personnel_authorization',
      entidad_id: autorizacion.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado: 'revocada' },
      detalles: `Autorización "${autorizacion.actividad}" de ${autorizacion.persona.email} revocada`,
      ip_address: req.ip,
    });

    logger.info(
      `[PERSONNEL] Autorización ${autorizacion.id} revocada por ${req.user.email}`
    );

    res.json({
      success: true,
      message: 'Autorización revocada',
      data: autorizacion,
    });
  } catch (error) {
    logger.error(`[PERSONNEL] Error revocando autorización: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'REVOKE_AUTH_ERROR',
        message: 'Error revocando la autorización',
      },
    });
  }
};

// Alertas: vencimientos de autorizaciones y capacitaciones + personal sin evaluación
exports.getPersonnelAlerts = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias || DIAS_ALERTA);
    const hoy = new Date().toISOString().split('T')[0];
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    const fechaLimite = limite.toISOString().split('T')[0];

    const [autorizaciones, registros, usuarios, evaluaciones] = await Promise.all([
      PersonnelAuthorization.findAll({
        where: {
          estado: 'vigente',
          fecha_vencimiento: { [Op.ne]: null, [Op.lte]: fechaLimite },
        },
        include: [{ model: User, as: 'persona', attributes: ['id', 'nombre', 'email'] }],
      }),
      PersonnelRecord.findAll({
        where: {
          fecha_vencimiento: { [Op.ne]: null, [Op.lte]: fechaLimite },
        },
        include: [{ model: User, as: 'persona', attributes: ['id', 'nombre', 'email'] }],
      }),
      User.findAll({
        where: { estado: 'activo' },
        attributes: ['id', 'nombre', 'email'],
      }),
      PersonnelRecord.findAll({
        where: { tipo: 'evaluacion_competencia' },
        attributes: ['user_id'],
      }),
    ]);

    const conEvaluacion = new Set(evaluaciones.map((e) => e.user_id));
    const sinEvaluacion = usuarios
      .filter((u) => !conEvaluacion.has(u.id))
      .map((u) => ({ id: u.id, nombre: u.nombre, email: u.email }));

    const alertasAutorizaciones = autorizaciones.map((a) => ({
      tipo: 'autorizacion',
      persona: a.persona ? a.persona.nombre : null,
      user_id: a.user_id,
      detalle: a.actividad,
      fecha_vencimiento: a.fecha_vencimiento,
      vencido: a.fecha_vencimiento < hoy,
    }));

    const alertasRegistros = registros.map((r) => ({
      tipo: r.tipo,
      persona: r.persona ? r.persona.nombre : null,
      user_id: r.user_id,
      detalle: r.descripcion,
      fecha_vencimiento: r.fecha_vencimiento,
      vencido: r.fecha_vencimiento < hoy,
    }));

    const alertas = [...alertasAutorizaciones, ...alertasRegistros].sort((a, b) =>
      a.fecha_vencimiento < b.fecha_vencimiento ? -1 : 1
    );

    res.json({
      success: true,
      data: {
        dias_anticipacion: dias,
        total: alertas.length,
        vencidas: alertas.filter((a) => a.vencido).length,
        por_vencer: alertas.filter((a) => !a.vencido).length,
        alertas,
        sin_evaluacion_competencia: sinEvaluacion,
      },
    });
  } catch (error) {
    logger.error(`[PERSONNEL] Error obteniendo alertas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ALERTS_ERROR',
        message: 'Error obteniendo alertas de personal',
      },
    });
  }
};

// "¿Está X autorizado para la magnitud M hoy?" (tarea 2.5)
exports.checkAuthorization = async (req, res) => {
  try {
    const { magnitud, fecha } = req.query;

    if (!magnitud) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'La magnitud es obligatoria' },
      });
    }

    const usuario = await User.findByPk(req.params.userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'El usuario no existe' },
      });
    }

    const resultado = await PersonnelAuthorizationService.estaAutorizado(usuario.id, magnitud, fecha);

    res.json({ success: true, data: resultado });
  } catch (error) {
    logger.error(`[PERSONNEL] Error consultando autorización: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CHECK_AUTH_ERROR', message: 'Error consultando la autorización' },
    });
  }
};
