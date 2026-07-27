const {
  WorkOrder,
  WorkOrderItem,
  ClientInstrument,
  Client,
  CalibrationCertificate,
  CalibrationDataFile,
  CalibrationFormEntry,
  Equipment,
  WorkOrderItemPatron,
  Quote,
  QuoteItem,
  User,
  AuditLog,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Editar el flag "acreditado" de un ítem ya creado es solo para
// supervisor+ (excluye personal_calidad, que sí puede gestionar la OT en
// otros aspectos). Al crear el ítem, en cambio, basta con estar en
// ROLES_GESTION (ver routes/workorder.routes.js).
const ROLES_ACREDITADO_EDIT = ['administrador', 'jefe_laboratorio', 'supervisor'];

// Resuelve el flag "acreditado" de cada ítem antes de crearlo: si trae
// quote_item_id, lo hereda del ítem de la cotización (que debe estar
// aceptada); si no, usa el valor que se haya mandado directamente (o false).
async function resolverAcreditadoPorItem(itemsCrudos) {
  return Promise.all(itemsCrudos.map(async (item, idx) => {
    if (!item.quote_item_id) {
      return { ...item, acreditado: Boolean(item.acreditado) };
    }

    const quoteItem = await QuoteItem.findByPk(item.quote_item_id, {
      include: [{ model: Quote, as: 'cotizacion' }],
    });
    if (!quoteItem) {
      throw new Error(`Ítem ${idx + 1}: el ítem de cotización referenciado no existe`);
    }
    if (!quoteItem.cotizacion || quoteItem.cotizacion.estado !== 'aceptada') {
      throw new Error(`Ítem ${idx + 1}: solo se puede heredar "acreditado" desde una cotización aceptada`);
    }

    return { ...item, acreditado: quoteItem.acreditado };
  }));
}

const WORK_ORDER_INCLUDES = [
  { model: Client, as: 'cliente', attributes: ['id', 'nombre', 'email_contacto'] },
  { model: User, as: 'responsable', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  { model: Quote, as: 'cotizacion', attributes: ['id', 'codigo', 'estado'] },
];

const WORK_ORDER_ITEM_INCLUDES = [
  {
    model: WorkOrderItem,
    as: 'items',
    include: [
      { model: ClientInstrument, as: 'instrumento' },
      {
        model: CalibrationCertificate,
        as: 'certificado',
        include: [{ model: CalibrationCertificate, as: 'certificadoOriginal', attributes: ['id', 'codigo'] }],
      },
      {
        model: CalibrationDataFile,
        as: 'archivosDatos',
        attributes: ['id', 'nombre_original', 'sha256', 'hash_verificado', 'createdAt'],
        include: [{ model: User, as: 'subidoPor', attributes: ['id', 'nombre'] }],
        separate: true,
        order: [['createdAt', 'DESC']],
      },
      {
        model: Equipment,
        as: 'patrones',
        attributes: ['id', 'codigo', 'nombre', 'magnitud', 'proxima_calibracion'],
        through: { attributes: [] },
      },
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
      quote_id,
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

    if (quote_id) {
      const cotizacionOrigen = await Quote.findByPk(quote_id);
      if (!cotizacionOrigen) {
        return res.status(404).json({
          success: false,
          error: { code: 'QUOTE_NOT_FOUND', message: 'La cotización de origen no existe' },
        });
      }
      if (cotizacionOrigen.cliente_id !== cliente_id) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'La cotización de origen no pertenece a este cliente' },
        });
      }
      if (cotizacionOrigen.estado !== 'aceptada') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Solo se puede crear una OT desde una cotización aceptada' },
        });
      }
    }

    let itemsResueltos;
    try {
      itemsResueltos = await resolverAcreditadoPorItem(items);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.message },
      });
    }

    const ordenTrabajo = await sequelize.transaction(async (t) => {
      const codigo = await WorkOrder.generarCodigo({ transaction: t });

      const orden = await WorkOrder.create({
        codigo,
        cliente_id,
        quote_id: quote_id || null,
        fecha_ingreso,
        fecha_compromiso: fecha_compromiso || null,
        responsable_id: responsable_id || null,
        observaciones,
        creado_por: req.user.id,
      }, { transaction: t });

      await WorkOrderItem.bulkCreate(
        itemsResueltos.map((item) => ({
          orden_trabajo_id: orden.id,
          instrumento_cliente_id: item.instrumento_cliente_id,
          condicion_recepcion: item.condicion_recepcion || null,
          acreditado: item.acreditado,
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
      cambios_nuevos: { codigo: ordenTrabajo.codigo, cliente: cliente.nombre, items: items.length, quote_id: quote_id || null },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Orden de trabajo creada: ${ordenTrabajo.codigo} por ${req.user.email}`);

    const ordenCompleta = await WorkOrder.findByPk(ordenTrabajo.id, {
      include: [...WORK_ORDER_INCLUDES, ...WORK_ORDER_ITEM_INCLUDES],
    });

    res.status(201).json({
      success: true,
      message: `Orden de trabajo ${ordenTrabajo.codigo} registrada correctamente`,
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
    const { instrumento_cliente_id, condicion_recepcion, quote_item_id, acreditado } = req.body;

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

    let itemResuelto;
    try {
      [itemResuelto] = await resolverAcreditadoPorItem([{ quote_item_id, acreditado }]);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validationError.message },
      });
    }

    const item = await WorkOrderItem.create({
      orden_trabajo_id: ordenTrabajo.id,
      instrumento_cliente_id,
      condicion_recepcion: condicion_recepcion || null,
      acreditado: itemResuelto.acreditado,
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

    if (
      req.body.acreditado !== undefined &&
      Boolean(req.body.acreditado) !== item.acreditado &&
      !ROLES_ACREDITADO_EDIT.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Solo supervisor, jefatura o administración pueden modificar el flag de acreditación',
        },
      });
    }

    if (req.body.incertidumbre_U !== undefined && req.body.incertidumbre_U !== null) {
      const valor = Number(req.body.incertidumbre_U);
      if (Number.isNaN(valor) || valor < 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'La incertidumbre (U) debe ser un número mayor o igual a 0' },
        });
      }
    }
    if (req.body.factor_k !== undefined && req.body.factor_k !== null) {
      const valor = Number(req.body.factor_k);
      if (Number.isNaN(valor) || valor <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'El factor de cobertura (k) debe ser un número mayor a 0' },
        });
      }
    }
    if (req.body.fuente_datos === 'excel_adjunto') {
      const hayArchivoDatos = await CalibrationDataFile.findOne({ where: { work_order_item_id: item.id } });
      if (!hayArchivoDatos) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_DATA_FILE',
            message: 'No hay ningún archivo de raw data adjunto en este ítem para referenciar como fuente',
          },
        });
      }
    }
    // Mismo criterio que 'excel_adjunto' arriba, ahora que la captura
    // digital tiene una contraparte real (tarea 3.2): 'digitación' no puede
    // ser solo una etiqueta sin nada detrás, exige al menos una captura
    // CONFIRMADA (una en borrador no cuenta — todavía puede estar incompleta
    // o fuera de rango).
    if (req.body.fuente_datos === 'digitacion') {
      const hayEntradaConfirmada = await CalibrationFormEntry.findOne({
        where: { work_order_item_id: item.id, estado: 'confirmado' },
      });
      if (!hayEntradaConfirmada) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_CONFIRMED_FORM_ENTRY',
            message: 'No hay ninguna captura de formulario confirmada en este ítem para referenciar como fuente',
          },
        });
      }
    }

    const camposPermitidos = ['estado', 'resultado', 'condicion_recepcion', 'observaciones', 'acreditado', 'incertidumbre_U', 'factor_k', 'puntos', 'fuente_datos'];
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

// Bandeja "Por facturar" (tarea 1.4): OTs listas para que la encargada de
// facturación externa las procese. Se saca de la bandeja marcando
// facturada_externamente, no cambiando el estado (entregar y facturar son
// eventos distintos: una OT puede facturarse antes de ser entregada).
function bandejaFacturacionWhere(query) {
  const { cliente_id, search } = query;
  const where = { estado: 'lista_para_facturar', facturada_externamente: false };
  if (cliente_id) where.cliente_id = cliente_id;
  if (search) where.codigo = { [Op.iLike]: `%${search}%` };
  return where;
}

exports.getBillingQueue = async (req, res) => {
  try {
    const ordenes = await WorkOrder.findAll({
      where: bandejaFacturacionWhere(req.query),
      include: WORK_ORDER_INCLUDES,
      order: [['fecha_ingreso', 'ASC']],
    });

    res.json({ success: true, data: ordenes });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error obteniendo la bandeja de facturación: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_BILLING_QUEUE_ERROR', message: 'Error obteniendo la bandeja de facturación' },
    });
  }
};

function csvEscape(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

exports.exportBillingQueueCsv = async (req, res) => {
  try {
    const ordenes = await WorkOrder.findAll({
      where: bandejaFacturacionWhere(req.query),
      include: WORK_ORDER_INCLUDES,
      order: [['fecha_ingreso', 'ASC']],
    });

    const encabezados = ['codigo', 'cliente', 'fecha_ingreso', 'fecha_compromiso', 'cotizacion', 'responsable'];
    const filas = ordenes.map((ot) => [
      ot.codigo,
      ot.cliente?.nombre || '',
      ot.fecha_ingreso || '',
      ot.fecha_compromiso || '',
      ot.cotizacion?.codigo || '',
      ot.responsable?.nombre || '',
    ]);
    const csv = [encabezados, ...filas].map((fila) => fila.map(csvEscape).join(',')).join('\r\n');

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'work_order_billing_queue',
      cambios_nuevos: { cantidad: ordenes.length },
      ip_address: req.ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="por-facturar-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('﻿' + csv);
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error exportando la bandeja de facturación: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_BILLING_QUEUE_ERROR', message: 'Error exportando la bandeja de facturación' },
    });
  }
};

// Marca la OT como ya facturada externamente: la saca de la bandeja sin
// tocar su estado de flujo operativo (entrega física es independiente).
exports.markFacturadaExternamente = async (req, res) => {
  try {
    const ordenTrabajo = await WorkOrder.findByPk(req.params.id);
    if (!ordenTrabajo) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' },
      });
    }

    if (ordenTrabajo.facturada_externamente) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_BILLED', message: 'Esta orden de trabajo ya fue marcada como facturada' },
      });
    }

    ordenTrabajo.facturada_externamente = true;
    ordenTrabajo.fecha_facturacion_externa = new Date().toISOString().split('T')[0];
    await ordenTrabajo.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'work_order',
      entidad_id: ordenTrabajo.id,
      cambios_nuevos: { facturada_externamente: true, fecha_facturacion_externa: ordenTrabajo.fecha_facturacion_externa },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Orden ${ordenTrabajo.codigo} marcada como facturada externamente por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Orden de trabajo marcada como facturada externamente',
      data: ordenTrabajo,
    });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error marcando facturación externa: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'MARK_BILLED_ERROR', message: 'Error marcando la orden de trabajo como facturada' },
    });
  }
};

// Patrones/equipos de referencia usados para calibrar un ítem (tarea 2.6:
// trazabilidad en el certificado). Many-to-many simple, sin límite de cuántos
// patrones puede usar una misma calibración.
exports.addPatronToItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { equipment_id } = req.body;

    if (!equipment_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe indicar el patrón (equipment_id)' },
      });
    }

    const item = await WorkOrderItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem no existe' },
      });
    }

    const patron = await Equipment.findByPk(equipment_id);
    if (!patron) {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El patrón no existe' },
      });
    }

    const yaAsociado = await WorkOrderItemPatron.findOne({ where: { work_order_item_id: itemId, equipment_id } });
    if (yaAsociado) {
      return res.status(409).json({
        success: false,
        error: { code: 'PATRON_ALREADY_ASSOCIATED', message: 'Ese patrón ya está asociado a este ítem' },
      });
    }

    const asociacion = await WorkOrderItemPatron.create({
      work_order_item_id: itemId,
      equipment_id,
      agregado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'work_order_item_patron',
      entidad_id: asociacion.id,
      cambios_nuevos: { item_id: itemId, patron: patron.codigo },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Patrón ${patron.codigo} asociado al ítem ${itemId} por ${req.user.email}`);

    res.status(201).json({ success: true, message: 'Patrón asociado correctamente', data: patron });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error asociando patrón: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'ADD_PATRON_ERROR', message: 'Error asociando el patrón al ítem' },
    });
  }
};

exports.removePatronFromItem = async (req, res) => {
  try {
    const { itemId, equipmentId } = req.params;

    const asociacion = await WorkOrderItemPatron.findOne({ where: { work_order_item_id: itemId, equipment_id: equipmentId } });
    if (!asociacion) {
      return res.status(404).json({
        success: false,
        error: { code: 'PATRON_NOT_ASSOCIATED', message: 'Ese patrón no está asociado a este ítem' },
      });
    }

    await asociacion.destroy();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'eliminar',
      entidad: 'work_order_item_patron',
      entidad_id: asociacion.id,
      cambios_anteriores: { item_id: itemId, equipment_id: equipmentId },
      ip_address: req.ip,
    });

    logger.info(`[WORK_ORDERS] Patrón ${equipmentId} desasociado del ítem ${itemId} por ${req.user.email}`);

    res.json({ success: true, message: 'Patrón quitado del ítem' });
  } catch (error) {
    logger.error(`[WORK_ORDERS] Error quitando patrón: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'REMOVE_PATRON_ERROR', message: 'Error quitando el patrón del ítem' },
    });
  }
};
