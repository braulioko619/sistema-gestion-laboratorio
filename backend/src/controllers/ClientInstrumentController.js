const {
  Client,
  ClientInstrument,
  WorkOrderItem,
  WorkOrder,
  CalibrationCertificate,
  User,
  AuditLog,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Días de anticipación para alertas de recalibración (misma convención que Equipment)
const DIAS_ALERTA = 60;

// Crear instrumento de cliente
exports.createClientInstrument = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      codigo_interno,
      codigo_cliente,
      tipo_instrumento,
      marca,
      modelo,
      numero_serie,
      rango_medida,
      resolucion,
      unidad,
      proxima_fecha_calibracion,
    } = req.body;

    if (!codigo_interno || !tipo_instrumento) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El código interno y el tipo de instrumento son obligatorios',
        },
      });
    }

    const cliente = await Client.findByPk(clientId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' },
      });
    }

    const existente = await ClientInstrument.findOne({ where: { codigo_interno } });
    if (existente) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CLIENT_INSTRUMENT_EXISTS',
          message: `Ya existe un instrumento con el código ${codigo_interno}`,
        },
      });
    }

    const instrumento = await ClientInstrument.create({
      cliente_id: cliente.id,
      codigo_interno,
      codigo_cliente,
      tipo_instrumento,
      marca,
      modelo,
      numero_serie,
      rango_medida,
      resolucion,
      unidad,
      proxima_fecha_calibracion: proxima_fecha_calibracion || null,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'client_instrument',
      entidad_id: instrumento.id,
      cambios_nuevos: { codigo_interno, tipo_instrumento, cliente: cliente.nombre },
      ip_address: req.ip,
    });

    logger.info(`[CLIENT_INSTRUMENTS] Instrumento creado: ${codigo_interno} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Instrumento ${codigo_interno} registrado correctamente`,
      data: instrumento,
    });
  } catch (error) {
    logger.error(`[CLIENT_INSTRUMENTS] Error creando instrumento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_CLIENT_INSTRUMENT_ERROR', message: 'Error creando el instrumento' },
    });
  }
};

// Listar instrumentos de un cliente
exports.getClientInstruments = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { cliente_id: clientId };
    if (estado) where.estado = estado;

    const { rows, count } = await ClientInstrument.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['codigo_interno', 'ASC']],
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
    logger.error(`[CLIENT_INSTRUMENTS] Error obteniendo instrumentos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_CLIENT_INSTRUMENTS_ERROR', message: 'Error obteniendo instrumentos' },
    });
  }
};

// Detalle de instrumento con historial de calibraciones a través de órdenes de trabajo
exports.getClientInstrumentById = async (req, res) => {
  try {
    const instrumento = await ClientInstrument.findOne({
      where: { id: req.params.id, cliente_id: req.params.clientId },
      include: [
        { model: Client, as: 'cliente', attributes: ['id', 'nombre', 'email_contacto'] },
        {
          model: WorkOrderItem,
          as: 'itemsOrden',
          include: [
            { model: WorkOrder, as: 'ordenTrabajo', attributes: ['id', 'codigo', 'fecha_ingreso', 'estado'] },
            { model: CalibrationCertificate, as: 'certificado' },
          ],
        },
      ],
      order: [[{ model: WorkOrderItem, as: 'itemsOrden' }, 'createdAt', 'DESC']],
    });

    if (!instrumento) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_INSTRUMENT_NOT_FOUND', message: 'El instrumento no existe' },
      });
    }

    res.json({ success: true, data: instrumento });
  } catch (error) {
    logger.error(`[CLIENT_INSTRUMENTS] Error obteniendo instrumento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_CLIENT_INSTRUMENT_ERROR', message: 'Error obteniendo el instrumento' },
    });
  }
};

// Actualizar instrumento de cliente
exports.updateClientInstrument = async (req, res) => {
  try {
    const instrumento = await ClientInstrument.findByPk(req.params.id);

    if (!instrumento) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_INSTRUMENT_NOT_FOUND', message: 'El instrumento no existe' },
      });
    }

    const camposPermitidos = [
      'codigo_cliente',
      'tipo_instrumento',
      'marca',
      'modelo',
      'numero_serie',
      'rango_medida',
      'resolucion',
      'unidad',
      'proxima_fecha_calibracion',
      'estado',
    ];

    const cambiosAnteriores = {};
    const cambiosNuevos = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== instrumento[campo]) {
        cambiosAnteriores[campo] = instrumento[campo];
        cambiosNuevos[campo] = req.body[campo];
        instrumento[campo] = req.body[campo];
      }
    });

    await instrumento.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'client_instrument',
        entidad_id: instrumento.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[CLIENT_INSTRUMENTS] Instrumento actualizado: ${instrumento.codigo_interno} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Instrumento actualizado correctamente',
      data: instrumento,
    });
  } catch (error) {
    logger.error(`[CLIENT_INSTRUMENTS] Error actualizando instrumento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_CLIENT_INSTRUMENT_ERROR', message: 'Error actualizando el instrumento' },
    });
  }
};

// Alertas de recalibración próxima/vencida
exports.getInstrumentAlerts = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias || DIAS_ALERTA);
    const hoy = new Date().toISOString().split('T')[0];
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    const fechaLimite = limite.toISOString().split('T')[0];

    const instrumentos = await ClientInstrument.findAll({
      where: {
        estado: { [Op.notIn]: ['dado_de_baja'] },
        proxima_fecha_calibracion: { [Op.lte]: fechaLimite, [Op.ne]: null },
      },
      include: [
        { model: Client, as: 'cliente', attributes: ['id', 'nombre', 'email_contacto'] },
      ],
      order: [['proxima_fecha_calibracion', 'ASC']],
    });

    const alertas = instrumentos.map((inst) => ({
      instrumento_id: inst.id,
      codigo_interno: inst.codigo_interno,
      tipo_instrumento: inst.tipo_instrumento,
      cliente: inst.cliente ? inst.cliente.nombre : null,
      cliente_id: inst.cliente_id,
      fecha_programada: inst.proxima_fecha_calibracion,
      vencido: inst.proxima_fecha_calibracion < hoy,
    }));

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
    logger.error(`[CLIENT_INSTRUMENTS] Error obteniendo alertas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_INSTRUMENT_ALERTS_ERROR', message: 'Error obteniendo alertas de instrumentos' },
    });
  }
};
