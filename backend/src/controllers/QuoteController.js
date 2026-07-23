const {
  Quote,
  QuoteItem,
  Client,
  ClientInstrument,
  PriceListItem,
  User,
  AuditLog,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { buildQuotePdf } = require('../utils/quotePdf');

const ESTADOS_VALIDOS = ['borrador', 'emitida', 'aceptada', 'rechazada', 'anulada'];

const QUOTE_INCLUDES = [
  {
    model: Client,
    as: 'cliente',
    attributes: ['id', 'nombre', 'identificacion_fiscal', 'email_contacto', 'direccion', 'telefono'],
  },
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  {
    model: QuoteItem,
    as: 'items',
    include: [
      { model: ClientInstrument, as: 'instrumento', attributes: ['id', 'codigo_interno', 'marca', 'modelo', 'numero_serie'] },
      { model: PriceListItem, as: 'tarifa', attributes: ['id', 'tipo_instrumento', 'protocolo'] },
    ],
  },
];

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function prepararItems(itemsCrudos) {
  if (!Array.isArray(itemsCrudos) || itemsCrudos.length === 0) {
    throw new Error('Debe agregar al menos un ítem a la cotización');
  }

  return itemsCrudos.map((raw, idx) => {
    const posicion = idx + 1;
    if (!raw.tipo_instrumento) throw new Error(`Ítem ${posicion}: falta el tipo de instrumento`);
    if (!raw.protocolo) throw new Error(`Ítem ${posicion}: falta el protocolo de calibración`);

    const cantidad = Number(raw.cantidad) || 1;
    if (cantidad <= 0) throw new Error(`Ítem ${posicion}: la cantidad debe ser mayor a 0`);

    const precio_unitario = Number(raw.precio_unitario);
    if (Number.isNaN(precio_unitario) || precio_unitario < 0) {
      throw new Error(`Ítem ${posicion}: el precio unitario no es válido`);
    }

    return {
      instrumento_cliente_id: raw.instrumento_cliente_id || null,
      tarifa_id: raw.tarifa_id || null,
      descripcion: raw.descripcion || raw.tipo_instrumento,
      tipo_instrumento: raw.tipo_instrumento,
      protocolo: raw.protocolo,
      cantidad,
      precio_unitario,
      subtotal: round2(cantidad * precio_unitario),
    };
  });
}

function calcularTotales(items, descuentoPorcentaje, ivaPorcentaje) {
  const subtotal = round2(items.reduce((sum, it) => sum + Number(it.subtotal), 0));
  const descuento_monto = round2((subtotal * (Number(descuentoPorcentaje) || 0)) / 100);
  const baseIva = subtotal - descuento_monto;
  const iva_monto = round2((baseIva * (Number(ivaPorcentaje) || 0)) / 100);
  const total = round2(baseIva + iva_monto);
  return { subtotal, descuento_monto, iva_monto, total };
}

exports.createQuote = async (req, res) => {
  try {
    const { cliente_id, validez_dias, descuento_porcentaje, iva_porcentaje, condiciones, notas, items } = req.body;

    if (!cliente_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El cliente es obligatorio' } });
    }

    const cliente = await Client.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({ success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' } });
    }

    let itemsPreparados;
    try {
      itemsPreparados = prepararItems(items);
    } catch (validationError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: validationError.message } });
    }

    const descuento = descuento_porcentaje || 0;
    const iva = iva_porcentaje === undefined || iva_porcentaje === null || iva_porcentaje === '' ? 19 : iva_porcentaje;
    const totales = calcularTotales(itemsPreparados, descuento, iva);
    const codigo = await Quote.generarCodigo();

    const cotizacionId = await sequelize.transaction(async (t) => {
      const cotizacion = await Quote.create({
        codigo,
        cliente_id,
        validez_dias: validez_dias || 30,
        descuento_porcentaje: descuento,
        iva_porcentaje: iva,
        condiciones,
        notas,
        creado_por: req.user.id,
        ...totales,
      }, { transaction: t });

      await QuoteItem.bulkCreate(
        itemsPreparados.map((item) => ({ ...item, cotizacion_id: cotizacion.id })),
        { transaction: t }
      );

      return cotizacion.id;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'quote',
      entidad_id: cotizacionId,
      cambios_nuevos: { cliente_id, total: totales.total, cantidad_items: itemsPreparados.length },
      detalles: `Cotización ${codigo} creada con ${itemsPreparados.length} ítem(s), total ${totales.total} ${cliente.moneda || 'CLP'}`,
      ip_address: req.ip,
    });

    logger.info(`[QUOTES] Cotización ${codigo} creada para ${cliente.nombre} por ${req.user.email}`);

    const resultado = await Quote.findByPk(cotizacionId, { include: QUOTE_INCLUDES });
    res.status(201).json({ success: true, message: `Cotización ${codigo} registrada correctamente`, data: resultado });
  } catch (error) {
    logger.error(`[QUOTES] Error creando cotización: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_QUOTE_ERROR', message: 'Error registrando la cotización' } });
  }
};

exports.getQuotes = async (req, res) => {
  try {
    const { cliente_id, estado, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (cliente_id) where.cliente_id = cliente_id;
    if (estado) where.estado = estado;
    if (search) where.codigo = { [Op.iLike]: `%${search}%` };

    const { rows, count } = await Quote.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'cliente', attributes: ['id', 'nombre'] },
        { model: User, as: 'registrador', attributes: ['id', 'nombre'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    logger.error(`[QUOTES] Error listando cotizaciones: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_QUOTES_ERROR', message: 'Error obteniendo las cotizaciones' } });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const cotizacion = await Quote.findByPk(req.params.id, { include: QUOTE_INCLUDES });
    if (!cotizacion) {
      return res.status(404).json({ success: false, error: { code: 'QUOTE_NOT_FOUND', message: 'La cotización no existe' } });
    }
    res.json({ success: true, data: cotizacion });
  } catch (error) {
    logger.error(`[QUOTES] Error obteniendo cotización: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_QUOTE_ERROR', message: 'Error obteniendo la cotización' } });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const cotizacion = await Quote.findByPk(req.params.id, { include: [{ model: QuoteItem, as: 'items' }] });
    if (!cotizacion) {
      return res.status(404).json({ success: false, error: { code: 'QUOTE_NOT_FOUND', message: 'La cotización no existe' } });
    }

    const camposPermitidos = ['validez_dias', 'descuento_porcentaje', 'iva_porcentaje', 'condiciones', 'notas'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && String(req.body[campo]) !== String(cotizacion[campo])) {
        cambiosAnteriores[campo] = cotizacion[campo];
        cambiosNuevos[campo] = req.body[campo];
        cotizacion[campo] = req.body[campo];
      }
    });

    let itemsActuales = cotizacion.items;
    let itemsCambiaron = false;

    if (Array.isArray(req.body.items)) {
      let itemsPreparados;
      try {
        itemsPreparados = prepararItems(req.body.items);
      } catch (validationError) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: validationError.message } });
      }

      await sequelize.transaction(async (t) => {
        await QuoteItem.destroy({ where: { cotizacion_id: cotizacion.id }, transaction: t });
        await QuoteItem.bulkCreate(
          itemsPreparados.map((item) => ({ ...item, cotizacion_id: cotizacion.id })),
          { transaction: t }
        );
      });

      itemsActuales = await QuoteItem.findAll({ where: { cotizacion_id: cotizacion.id } });
      itemsCambiaron = true;
    }

    const totales = calcularTotales(itemsActuales, cotizacion.descuento_porcentaje, cotizacion.iva_porcentaje);
    Object.assign(cotizacion, totales);
    await cotizacion.save();

    if (Object.keys(cambiosNuevos).length > 0 || itemsCambiaron) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'quote',
        entidad_id: cotizacion.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        detalles: itemsCambiaron
          ? `Se actualizaron los ítems de la cotización (${itemsActuales.length} ítem(s)), nuevo total: ${totales.total}`
          : `Datos generales actualizados, nuevo total: ${totales.total}`,
        ip_address: req.ip,
      });
    }

    logger.info(`[QUOTES] Cotización ${cotizacion.codigo} actualizada por ${req.user.email}`);

    const resultado = await Quote.findByPk(cotizacion.id, { include: QUOTE_INCLUDES });
    res.json({ success: true, message: 'Cotización actualizada correctamente', data: resultado });
  } catch (error) {
    logger.error(`[QUOTES] Error actualizando cotización: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_QUOTE_ERROR', message: 'Error actualizando la cotización' } });
  }
};

exports.updateQuoteEstado = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` },
      });
    }

    const cotizacion = await Quote.findByPk(req.params.id);
    if (!cotizacion) {
      return res.status(404).json({ success: false, error: { code: 'QUOTE_NOT_FOUND', message: 'La cotización no existe' } });
    }

    const estadoAnterior = cotizacion.estado;
    cotizacion.estado = estado;

    if (estado === 'emitida' && !cotizacion.fecha_emision) {
      const hoy = new Date();
      cotizacion.fecha_emision = hoy.toISOString().split('T')[0];
      const vencimiento = new Date(hoy);
      vencimiento.setDate(vencimiento.getDate() + (cotizacion.validez_dias || 30));
      cotizacion.fecha_vencimiento = vencimiento.toISOString().split('T')[0];
    }

    await cotizacion.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: estado === 'emitida' ? 'publicar' : 'actualizar',
      entidad: 'quote',
      entidad_id: cotizacion.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado },
      detalles: `Cambio de estado: ${estadoAnterior} → ${estado}`,
      ip_address: req.ip,
    });

    logger.info(`[QUOTES] Cotización ${cotizacion.codigo} pasó de ${estadoAnterior} a ${estado} por ${req.user.email}`);
    res.json({ success: true, message: 'Estado de la cotización actualizado correctamente', data: cotizacion });
  } catch (error) {
    logger.error(`[QUOTES] Error actualizando estado: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_QUOTE_ESTADO_ERROR', message: 'Error actualizando el estado de la cotización' } });
  }
};

exports.getQuoteHistory = async (req, res) => {
  try {
    const cotizacion = await Quote.findByPk(req.params.id);
    if (!cotizacion) {
      return res.status(404).json({ success: false, error: { code: 'QUOTE_NOT_FOUND', message: 'La cotización no existe' } });
    }

    const historial = await AuditLog.findAll({
      where: { entidad: 'quote', entidad_id: cotizacion.id },
      include: [{ model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      order: [['timestamp', 'DESC']],
    });

    res.json({ success: true, data: historial });
  } catch (error) {
    logger.error(`[QUOTES] Error obteniendo historial: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_QUOTE_HISTORY_ERROR', message: 'Error obteniendo el historial de la cotización' } });
  }
};

exports.downloadQuotePdf = async (req, res) => {
  try {
    const cotizacion = await Quote.findByPk(req.params.id, { include: QUOTE_INCLUDES });
    if (!cotizacion) {
      return res.status(404).json({ success: false, error: { code: 'QUOTE_NOT_FOUND', message: 'La cotización no existe' } });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'quote',
      entidad_id: cotizacion.id,
      ip_address: req.ip,
    });

    buildQuotePdf(cotizacion, res);
  } catch (error) {
    logger.error(`[QUOTES] Error generando PDF: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: { code: 'DOWNLOAD_QUOTE_PDF_ERROR', message: 'Error generando el PDF de la cotización' } });
    }
  }
};

exports.QUOTE_INCLUDES = QUOTE_INCLUDES;
