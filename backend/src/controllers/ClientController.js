const { Client, ClientInstrument, ClientAddress, ClientContact, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const CLIENT_INCLUDES = [
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
];

// Crear cliente
exports.createClient = async (req, res) => {
  try {
    const {
      nombre,
      identificacion_fiscal,
      direccion,
      telefono,
      contacto_nombre,
      email_contacto,
    } = req.body;

    if (!nombre || !identificacion_fiscal || !email_contacto) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El nombre, identificación fiscal y correo de contacto son obligatorios',
        },
      });
    }

    const existente = await Client.findOne({ where: { identificacion_fiscal } });
    if (existente) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CLIENT_EXISTS',
          message: `Ya existe un cliente con la identificación fiscal ${identificacion_fiscal}`,
        },
      });
    }

    const cliente = await Client.create({
      nombre,
      identificacion_fiscal,
      direccion,
      telefono,
      contacto_nombre,
      email_contacto,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'client',
      entidad_id: cliente.id,
      cambios_nuevos: { nombre, identificacion_fiscal, email_contacto },
      ip_address: req.ip,
    });

    logger.info(`[CLIENTS] Cliente creado: ${nombre} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Cliente ${nombre} registrado correctamente`,
      data: cliente,
    });
  } catch (error) {
    logger.error(`[CLIENTS] Error creando cliente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_CLIENT_ERROR', message: 'Error creando el cliente' },
    });
  }
};

// Listar clientes
exports.getClients = async (req, res) => {
  try {
    const { estado, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { identificacion_fiscal: { [Op.iLike]: `%${search}%` } },
        { email_contacto: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows, count } = await Client.findAndCountAll({
      where,
      include: CLIENT_INCLUDES,
      offset,
      limit: parseInt(limit),
      order: [['nombre', 'ASC']],
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
    logger.error(`[CLIENTS] Error obteniendo clientes: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_CLIENTS_ERROR', message: 'Error obteniendo clientes' },
    });
  }
};

// Detalle de cliente con sus instrumentos
exports.getClientById = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id, {
      include: [
        ...CLIENT_INCLUDES,
        { model: ClientInstrument, as: 'instrumentos' },
        { model: ClientAddress, as: 'direcciones' },
        { model: ClientContact, as: 'contactos' },
      ],
      order: [
        [{ model: ClientAddress, as: 'direcciones' }, 'principal', 'DESC'],
        [{ model: ClientContact, as: 'contactos' }, 'principal', 'DESC'],
      ],
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' },
      });
    }

    res.json({ success: true, data: cliente });
  } catch (error) {
    logger.error(`[CLIENTS] Error obteniendo cliente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_CLIENT_ERROR', message: 'Error obteniendo el cliente' },
    });
  }
};

// Actualizar cliente
exports.updateClient = async (req, res) => {
  try {
    const cliente = await Client.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' },
      });
    }

    const camposPermitidos = [
      'nombre',
      'direccion',
      'telefono',
      'contacto_nombre',
      'email_contacto',
      'estado',
    ];

    const cambiosAnteriores = {};
    const cambiosNuevos = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== cliente[campo]) {
        cambiosAnteriores[campo] = cliente[campo];
        cambiosNuevos[campo] = req.body[campo];
        cliente[campo] = req.body[campo];
      }
    });

    await cliente.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'client',
        entidad_id: cliente.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[CLIENTS] Cliente actualizado: ${cliente.nombre} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      data: cliente,
    });
  } catch (error) {
    logger.error(`[CLIENTS] Error actualizando cliente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_CLIENT_ERROR', message: 'Error actualizando el cliente' },
    });
  }
};
