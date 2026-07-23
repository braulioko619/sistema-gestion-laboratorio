const {
  Equipment,
  EquipmentEvent,
  NonConformity,
  User,
  AuditLog,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Días de anticipación para alertas de vencimiento (decisión de diseño: 60)
const DIAS_ALERTA = 60;

const EQUIPMENT_INCLUDES = [
  { model: User, as: 'responsable', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
];

const CAMPO_PROXIMA = {
  calibracion: 'proxima_calibracion',
  mantenimiento: 'proximo_mantenimiento',
  verificacion_intermedia: 'proxima_verificacion',
};

// Crear equipo
exports.createEquipment = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      marca,
      modelo,
      numero_serie,
      ubicacion,
      rango,
      resolucion,
      magnitud,
      norma,
      protocolo,
      hoja_de_vida,
      responsable_id,
      fecha_ingreso,
      observaciones,
    } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El código y el nombre del equipo son obligatorios',
        },
      });
    }

    const existente = await Equipment.findOne({ where: { codigo } });
    if (existente) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EQUIPMENT_EXISTS',
          message: `Ya existe un equipo con el código ${codigo}`,
        },
      });
    }

    const equipo = await Equipment.create({
      codigo,
      nombre,
      marca,
      modelo,
      numero_serie,
      ubicacion,
      rango,
      resolucion,
      magnitud,
      norma,
      protocolo,
      hoja_de_vida,
      responsable_id: responsable_id || null,
      fecha_ingreso,
      observaciones,
      registrado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'equipment',
      entidad_id: equipo.id,
      cambios_nuevos: { codigo, nombre, marca, modelo },
      ip_address: req.ip,
    });

    logger.info(`[EQUIPMENT] Equipo creado: ${codigo} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Equipo ${codigo} registrado correctamente`,
      data: equipo,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT] Error creando equipo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_EQUIPMENT_ERROR',
        message: 'Error creando el equipo',
      },
    });
  }
};

// Listar equipos
exports.getEquipment = async (req, res) => {
  try {
    const { estado, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (search) {
      where[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { nombre: { [Op.iLike]: `%${search}%` } },
        { numero_serie: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Equipment.findAndCountAll({
      where,
      include: EQUIPMENT_INCLUDES,
      offset,
      limit: parseInt(limit),
      order: [['codigo', 'ASC']],
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
    logger.error(`[EQUIPMENT] Error obteniendo equipos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EQUIPMENT_ERROR',
        message: 'Error obteniendo equipos',
      },
    });
  }
};

// Detalle de equipo con historial completo (6.4.13)
exports.getEquipmentById = async (req, res) => {
  try {
    const equipo = await Equipment.findByPk(req.params.id, {
      include: [
        ...EQUIPMENT_INCLUDES,
        {
          model: EquipmentEvent,
          as: 'eventos',
          include: [
            { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
          ],
        },
      ],
      order: [[{ model: EquipmentEvent, as: 'eventos' }, 'fecha_realizacion', 'DESC']],
    });

    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'El equipo no existe',
        },
      });
    }

    res.json({ success: true, data: equipo });
  } catch (error) {
    logger.error(`[EQUIPMENT] Error obteniendo equipo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EQUIPMENT_ERROR',
        message: 'Error obteniendo el equipo',
      },
    });
  }
};

// Actualizar equipo (datos generales y estado)
exports.updateEquipment = async (req, res) => {
  try {
    const equipo = await Equipment.findByPk(req.params.id);

    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'El equipo no existe',
        },
      });
    }

    const camposPermitidos = [
      'nombre',
      'marca',
      'modelo',
      'numero_serie',
      'ubicacion',
      'rango',
      'resolucion',
      'magnitud',
      'norma',
      'protocolo',
      'hoja_de_vida',
      'responsable_id',
      'estado',
      'fecha_ingreso',
      'observaciones',
    ];

    const cambiosAnteriores = {};
    const cambiosNuevos = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== equipo[campo]) {
        cambiosAnteriores[campo] = equipo[campo];
        cambiosNuevos[campo] = req.body[campo];
        equipo[campo] = req.body[campo];
      }
    });

    await equipo.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'equipment',
        entidad_id: equipo.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[EQUIPMENT] Equipo actualizado: ${equipo.codigo} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Equipo actualizado correctamente',
      data: equipo,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT] Error actualizando equipo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_EQUIPMENT_ERROR',
        message: 'Error actualizando el equipo',
      },
    });
  }
};

// Registrar evento (calibración, mantenimiento, verificación intermedia)
exports.createEquipmentEvent = async (req, res) => {
  try {
    const {
      tipo,
      fecha_realizacion,
      proveedor,
      certificado_numero,
      trazabilidad,
      resultado,
      proxima_fecha,
      observaciones,
    } = req.body;

    if (!tipo || !fecha_realizacion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El tipo y la fecha de realización son obligatorios',
        },
      });
    }

    const equipo = await Equipment.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'El equipo no existe',
        },
      });
    }

    const evento = await EquipmentEvent.create({
      equipment_id: equipo.id,
      tipo,
      fecha_realizacion,
      proveedor,
      certificado_numero,
      trazabilidad,
      resultado: resultado || null,
      proxima_fecha: proxima_fecha || null,
      observaciones,
      registrado_por: req.user.id,
    });

    // Actualizar la próxima fecha programada en el equipo
    const campoProxima = CAMPO_PROXIMA[tipo];
    if (campoProxima && proxima_fecha) {
      equipo[campoProxima] = proxima_fecha;
      await equipo.save();
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'equipment_event',
      entidad_id: evento.id,
      cambios_nuevos: {
        equipo: equipo.codigo,
        tipo,
        fecha_realizacion,
        resultado,
        proxima_fecha,
      },
      ip_address: req.ip,
    });

    // ISO 17025 6.4.9: resultado no conforme exige evaluar el impacto
    // en los trabajos previos del equipo → NC automática
    let noConformidad = null;
    if (resultado === 'no_conforme') {
      try {
        const codigoNC = await NonConformity.generarCodigo();
        noConformidad = await NonConformity.create({
          codigo: codigoNC,
          fuente: 'equipo',
          descripcion: `Equipo ${equipo.codigo} (${equipo.nombre}): ${tipo.replace(/_/g, ' ')} con resultado NO CONFORME el ${fecha_realizacion}${certificado_numero ? ` (certificado ${certificado_numero})` : ''}. Se debe evaluar el impacto en los resultados emitidos desde la última ${tipo === 'calibracion' ? 'calibración' : 'intervención'} conforme (ISO 17025 6.4.9).`,
          clasificacion: 'mayor',
          decision_trabajo: 'suspender',
          estado: 'abierta',
          registrado_por: req.user.id,
        });

        // El equipo sale de servicio hasta resolver la NC
        equipo.estado = 'fuera_servicio';
        await equipo.save();

        await AuditLog.create({
          usuario_id: req.user.id,
          accion: 'crear',
          entidad: 'non_conformity',
          entidad_id: noConformidad.id,
          cambios_nuevos: {
            codigo: codigoNC,
            fuente: 'equipo',
            equipo: equipo.codigo,
            origen: 'automatico',
          },
          ip_address: req.ip,
        });

        logger.info(
          `[NC] NC automática ${codigoNC} por ${tipo} no conforme del equipo ${equipo.codigo}`
        );
      } catch (ncError) {
        logger.error(`[NC] Error creando NC automática de equipo: ${ncError.message}`);
      }
    }

    logger.info(
      `[EQUIPMENT] Evento ${tipo} registrado para ${equipo.codigo} por ${req.user.email}`
    );

    res.status(201).json({
      success: true,
      message: noConformidad
        ? `Evento registrado. Resultado no conforme: se generó la NC ${noConformidad.codigo} y el equipo pasó a fuera de servicio`
        : 'Evento registrado correctamente',
      data: evento,
      no_conformidad: noConformidad,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT] Error registrando evento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_EVENT_ERROR',
        message: 'Error registrando el evento',
      },
    });
  }
};

// Alertas de vencimiento (calibraciones/mantenimientos vencidos o por vencer)
exports.getEquipmentAlerts = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias || DIAS_ALERTA);
    const hoy = new Date().toISOString().split('T')[0];
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    const fechaLimite = limite.toISOString().split('T')[0];

    const equipos = await Equipment.findAll({
      where: {
        estado: { [Op.notIn]: ['dado_de_baja'] },
        [Op.or]: [
          { proxima_calibracion: { [Op.lte]: fechaLimite } },
          { proximo_mantenimiento: { [Op.lte]: fechaLimite } },
          { proxima_verificacion: { [Op.lte]: fechaLimite } },
        ],
      },
      include: EQUIPMENT_INCLUDES,
      order: [['proxima_calibracion', 'ASC']],
    });

    const alertas = [];
    equipos.forEach((eq) => {
      [
        ['calibracion', eq.proxima_calibracion],
        ['mantenimiento', eq.proximo_mantenimiento],
        ['verificacion_intermedia', eq.proxima_verificacion],
      ].forEach(([tipo, fecha]) => {
        if (fecha && fecha <= fechaLimite) {
          alertas.push({
            equipo_id: eq.id,
            codigo: eq.codigo,
            nombre: eq.nombre,
            estado: eq.estado,
            tipo,
            fecha_programada: fecha,
            vencido: fecha < hoy,
            responsable: eq.responsable ? eq.responsable.nombre : null,
          });
        }
      });
    });

    alertas.sort((a, b) => (a.fecha_programada < b.fecha_programada ? -1 : 1));

    res.json({
      success: true,
      data: {
        dias_anticipacion: dias,
        total: alertas.length,
        vencidas: alertas.filter((a) => a.vencido).length,
        por_vencer: alertas.filter((a) => !a.vencido).length,
        alertas,
      },
    });
  } catch (error) {
    logger.error(`[EQUIPMENT] Error obteniendo alertas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ALERTS_ERROR',
        message: 'Error obteniendo alertas de equipos',
      },
    });
  }
};
