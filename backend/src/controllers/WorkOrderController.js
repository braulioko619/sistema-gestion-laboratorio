const {
  WorkOrder,
  WorkOrderItem,
  ClientInstrument,
  Client,
  CalibrationCertificate,
  User,
  AuditLog,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const WORK_ORDER_INCLUDES = [
  { model: Client, as: 'cliente', attributes: ['id', 'nombre', 'email_contacto'] },
  { model: User, as: 'responsable', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
];

const WORK_ORDER_ITEM_INCLUDES = [
  {
    model: WorkOrderItem,
    as: 'items',
    include: [
      { model: ClientInstrument, as: 'instrumento' },
      { model: CalibrationCertificate, as: 'certificado' },
    ],
  },
];

// Crear orden de trabajo con sus ítems iniciales
exports.createWorkOrder = async (req, res) => {
  try {
    const {
      cliente_id,
      fecha_ingreso,
      fecha_compromiso,
      responsable_id,
      observaciones,
      items,
    } = req.body;

    if (!cliente_id || !fecha_ingreso || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El cliente, la fecha de ingreso y al menos un instrumento son obligatorios',
        },
      });
    }

    const cliente = await Client.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' },
      });
    }

    const codigo = await WorkOrder.generarCodigo();

    const ordenTrabajo = await sequelize.transaction(async (t) => {
      const orden = await WorkOrder.create({
        codigo,
        cliente_id,
        fecha_ingreso,
        fecha_compromiso: fecha_compromiso || null,
        responsable_id: responsable_id || null,
        observaciones,
        creado_por: req.user.id,
      }, { transaction: t });

      await WorkOrderItem.bulkCreate(
        items.map((item) => ({
          orden_trabajo_id: orden.id,
          instrumento_cliente_id: item.instrumento_cliente_id,
          condicion_recepcion: item.condicion_recepcion || null,
        })),
        { transaction: t }
      );

      return orden;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'work_order',
      entidad_id: ordenTrabajo.id,
      cambios_nuevos: { codigo, cliente: cliente.nombre, items: items.length },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Orden de trabajo creada: ${codigo} por ${req.user.email}`);

    const ordenCompleta = await WorkOrder.findByPk(ordenTrabajo.id, {
      include: [...WORK_ORDER_INCLUDES, ...WORK_ORDER_ITEM_INCLUDES],
    });

    res.status(201).json({
      success: true,
      message: `Orden de trabajo ${codigo} registrada correctamente`,
      data: ordenCompleta,
    });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error creando orden de trabajo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_WORK_ORDER_ERROR', message: 'Error creando la orden de trabajo' },
    });
  }
};

// Listar órdenes de trabajo
exports.getWorkOrders = async (req, res) => {
  try {
    const { estado, cliente_id, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;
    if (search) where.codigo = { [Op.iLike]: `%${search}%` };

    const { rows, count } = await WorkOrder.findAndCountAll({
      where,
      include: WORK_ORDER_INCLUDES,
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
    logger.error(`[WORK_ORDERS] Error obteniendo órdenes de trabajo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_WORK_ORDERS_ERROR', message: 'Error obteniendo órdenes de trabajo' },
    });
  }
};

// Detalle de orden de trabajo con ítems, instrumentos y certificados
exports.getWorkOrderById = async (req, res) => {
  try {
    const ordenTrabajo = await WorkOrder.findByPk(req.params.id, {
      include: [...WORK_ORDER_INCLUDES, ...WORK_ORDER_ITEM_INCLUDES],
    });

    if (!ordenTrabajo) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' },
      });
    }

    res.json({ success: true, data: ordenTrabajo });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error obteniendo orden de trabajo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_WORK_ORDER_ERROR', message: 'Error obteniendo la orden de trabajo' },
    });
  }
};

// Cambiar el estado de la orden de trabajo (transición manual por el personal)
exports.updateWorkOrderEstado = async (req, res) => {
  try {
    const { estado, fecha_entrega, observaciones } = req.body;
    const ordenTrabajo = await WorkOrder.findByPk(req.params.id);

    if (!ordenTrabajo) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' },
      });
    }

    if (!estado) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'El estado es obligatorio' },
      });
    }

    const estadoAnterior = ordenTrabajo.estado;
    ordenTrabajo.estado = estado;
    if (fecha_entrega !== undefined) ordenTrabajo.fecha_entrega = fecha_entrega;
    if (observaciones !== undefined) ordenTrabajo.observaciones = observaciones;
    await ordenTrabajo.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'work_order',
      entidad_id: ordenTrabajo.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Orden ${ordenTrabajo.codigo} pasó de ${estadoAnterior} a ${estado} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Estado de la orden de trabajo actualizado correctamente',
      data: ordenTrabajo,
    });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error actualizando estado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_WORK_ORDER_ESTADO_ERROR', message: 'Error actualizando el estado de la orden de trabajo' },
    });
  }
};

// Agregar un instrumento a una orden de trabajo existente
exports.addWorkOrderItem = async (req, res) => {
  try {
    const { instrumento_cliente_id, condicion_recepcion } = req.body;

    if (!instrumento_cliente_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'El instrumento es obligatorio' },
      });
    }

    const ordenTrabajo = await WorkOrder.findByPk(req.params.id);
    if (!ordenTrabajo) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' },
      });
    }

    const yaExiste = await WorkOrderItem.findOne({
      where: { orden_trabajo_id: ordenTrabajo.id, instrumento_cliente_id },
    });
    if (yaExiste) {
      return res.status(409).json({
        success: false,
        error: { code: 'ITEM_EXISTS', message: 'Ese instrumento ya está en la orden de trabajo' },
      });
    }

    const item = await WorkOrderItem.create({
      orden_trabajo_id: ordenTrabajo.id,
      instrumento_cliente_id,
      condicion_recepcion: condicion_recepcion || null,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'work_order_item',
      entidad_id: item.id,
      cambios_nuevos: { orden: ordenTrabajo.codigo, instrumento_cliente_id },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Ítem agregado a ${ordenTrabajo.codigo} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Instrumento agregado a la orden de trabajo',
      data: item,
    });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error agregando ítem: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'ADD_WORK_ORDER_ITEM_ERROR', message: 'Error agregando el instrumento a la orden de trabajo' },
    });
  }
};

// Actualizar un ítem de la orden de trabajo (estado, resultado, condición)
exports.updateWorkOrderItem = async (req, res) => {
  try {
    const item = await WorkOrderItem.findByPk(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem no existe' },
      });
    }

    const camposPermitidos = ['estado', 'resultado', 'condicion_recepcion', 'observaciones'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== item[campo]) {
        cambiosAnteriores[campo] = item[campo];
        cambiosNuevos[campo] = req.body[campo];
        item[campo] = req.body[campo];
      }
    });

    await item.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'work_order_item',
        entidad_id: item.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[WORK_ORDERS] Ítem ${item.id} actualizado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Ítem actualizado correctamente',
      data: item,
    });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error actualizando ítem: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_WORK_ORDER_ITEM_ERROR', message: 'Error actualizando el ítem' },
    });
  }
};
