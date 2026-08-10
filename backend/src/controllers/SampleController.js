const {
  Sample,
  Client,
  ClientInstrument,
  WorkOrder,
  WorkOrderItem,
  User,
  AuditLog,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const ESTADOS_VALIDOS = ['pendiente', 'asignada', 'rechazada'];
const ESTADOS_OT_CIERRE = ['entregada', 'cancelada'];

const SAMPLE_INCLUDES = [
  { model: Client, as: 'cliente', attributes: ['id', 'nombre'] },
  { model: ClientInstrument, as: 'instrumento', attributes: ['id', 'codigo_interno', 'tipo_instrumento'] },
  { model: WorkOrder, as: 'ordenTrabajo', attributes: ['id', 'codigo', 'estado'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre'] },
];

exports.getSamples = async (req, res) => {
  try {
    const { estado, cliente_id, search } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;
    if (search) where.numero_muestra = { [Op.iLike]: `%${search}%` };

    const muestras = await Sample.findAll({
      where,
      include: SAMPLE_INCLUDES,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: muestras });
  } catch (error) {
    logger.error(`[SAMPLES] Error listando muestras: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_SAMPLES_ERROR', message: 'Error obteniendo las muestras' } });
  }
};

exports.getSampleById = async (req, res) => {
  try {
    const muestra = await Sample.findByPk(req.params.id, { include: SAMPLE_INCLUDES });
    if (!muestra) {
      return res.status(404).json({ success: false, error: { code: 'SAMPLE_NOT_FOUND', message: 'La muestra no existe' } });
    }
    res.json({ success: true, data: muestra });
  } catch (error) {
    logger.error(`[SAMPLES] Error obteniendo muestra: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_SAMPLE_ERROR', message: 'Error obteniendo la muestra' } });
  }
};

exports.createSample = async (req, res) => {
  try {
    const {
      cliente_id, instrumento_cliente_id, tipo_instrumento, marca, modelo, numero_serie,
      condicion_recepcion, observaciones, fecha_recepcion,
    } = req.body;

    if (!cliente_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El cliente es obligatorio' } });
    }

    const cliente = await Client.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({ success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' } });
    }

    let tipoFinal = tipo_instrumento;
    let marcaFinal = marca;
    let modeloFinal = modelo;
    let numeroSerieFinal = numero_serie;

    if (instrumento_cliente_id) {
      const instrumento = await ClientInstrument.findByPk(instrumento_cliente_id);
      if (!instrumento) {
        return res.status(404).json({ success: false, error: { code: 'INSTRUMENT_NOT_FOUND', message: 'El instrumento no existe' } });
      }
      if (instrumento.cliente_id !== cliente_id) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El instrumento no pertenece a este cliente' } });
      }
      tipoFinal = tipoFinal || instrumento.tipo_instrumento;
      marcaFinal = marcaFinal || instrumento.marca;
      modeloFinal = modeloFinal || instrumento.modelo;
      numeroSerieFinal = numeroSerieFinal || instrumento.numero_serie;
    }

    if (!tipoFinal || !tipoFinal.trim()) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El tipo de instrumento es obligatorio (o selecciona un instrumento ya registrado)' } });
    }

    const { muestraId, numero } = await sequelize.transaction(async (t) => {
      const numero_muestra = await Sample.generarNumero({ transaction: t });

      const muestra = await Sample.create({
        numero_muestra,
        cliente_id,
        instrumento_cliente_id: instrumento_cliente_id || null,
        tipo_instrumento: tipoFinal,
        marca: marcaFinal || null,
        modelo: modeloFinal || null,
        numero_serie: numeroSerieFinal || null,
        condicion_recepcion: condicion_recepcion || null,
        observaciones: observaciones || null,
        fecha_recepcion: fecha_recepcion || new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        creado_por: req.user.id,
      }, { transaction: t });

      return { muestraId: muestra.id, numero: numero_muestra };
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'sample',
      entidad_id: muestraId,
      cambios_nuevos: { numero_muestra: numero, cliente: cliente.nombre, tipo_instrumento: tipoFinal },
      ip_address: req.ip,
    });

    logger.info(`[SAMPLES] Muestra ${numero} registrada para ${cliente.nombre} por ${req.user.email}`);

    const resultado = await Sample.findByPk(muestraId, { include: SAMPLE_INCLUDES });
    res.status(201).json({ success: true, message: `Muestra ${numero} registrada correctamente`, data: resultado });
  } catch (error) {
    logger.error(`[SAMPLES] Error registrando muestra: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_SAMPLE_ERROR', message: 'Error registrando la muestra' } });
  }
};

exports.updateSample = async (req, res) => {
  try {
    const muestra = await Sample.findByPk(req.params.id);
    if (!muestra) {
      return res.status(404).json({ success: false, error: { code: 'SAMPLE_NOT_FOUND', message: 'La muestra no existe' } });
    }
    if (muestra.estado !== 'pendiente') {
      return res.status(409).json({ success: false, error: { code: 'SAMPLE_NOT_PENDING', message: 'Solo se puede editar una muestra pendiente' } });
    }
    if (req.body.estado !== undefined && !ESTADOS_VALIDOS.includes(req.body.estado)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` } });
    }

    const camposPermitidos = [
      'tipo_instrumento', 'marca', 'modelo', 'numero_serie',
      'condicion_recepcion', 'observaciones', 'fecha_recepcion', 'estado',
    ];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== muestra[campo]) {
        cambiosAnteriores[campo] = muestra[campo];
        cambiosNuevos[campo] = req.body[campo];
        muestra[campo] = req.body[campo];
      }
    });

    await muestra.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'sample',
        entidad_id: muestra.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    const resultado = await Sample.findByPk(muestra.id, { include: SAMPLE_INCLUDES });
    res.json({ success: true, message: 'Muestra actualizada correctamente', data: resultado });
  } catch (error) {
    logger.error(`[SAMPLES] Error actualizando muestra: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_SAMPLE_ERROR', message: 'Error actualizando la muestra' } });
  }
};

// Crea (si hace falta) el ClientInstrument a partir de los datos de la
// muestra, para poder usarlo como instrumento_cliente_id de un WorkOrderItem
// (que lo exige siempre), sin obligar a preregistrar el instrumento antes.
async function resolverInstrumentoDeMuestra(muestra, usuarioId, t) {
  if (muestra.instrumento_cliente_id) return muestra.instrumento_cliente_id;

  const instrumento = await ClientInstrument.create({
    cliente_id: muestra.cliente_id,
    codigo_interno: muestra.numero_muestra,
    tipo_instrumento: muestra.tipo_instrumento,
    marca: muestra.marca,
    modelo: muestra.modelo,
    numero_serie: muestra.numero_serie,
    creado_por: usuarioId,
  }, { transaction: t });

  return instrumento.id;
}

exports.assignToWorkOrder = async (req, res) => {
  try {
    const { work_order_id } = req.body;
    if (!work_order_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Debe indicar la orden de trabajo destino' } });
    }

    const muestra = await Sample.findByPk(req.params.id);
    if (!muestra) {
      return res.status(404).json({ success: false, error: { code: 'SAMPLE_NOT_FOUND', message: 'La muestra no existe' } });
    }
    if (muestra.estado !== 'pendiente') {
      return res.status(409).json({ success: false, error: { code: 'SAMPLE_NOT_PENDING', message: 'Esta muestra ya fue asignada o rechazada' } });
    }

    const ordenTrabajo = await WorkOrder.findByPk(work_order_id);
    if (!ordenTrabajo) {
      return res.status(404).json({ success: false, error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' } });
    }
    if (ordenTrabajo.cliente_id !== muestra.cliente_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'La orden de trabajo no pertenece al mismo cliente de la muestra' } });
    }
    if (ESTADOS_OT_CIERRE.includes(ordenTrabajo.estado)) {
      return res.status(409).json({ success: false, error: { code: 'WORK_ORDER_CLOSED', message: 'No se pueden agregar instrumentos a una orden entregada o cancelada' } });
    }

    const resultado = await sequelize.transaction(async (t) => {
      const instrumentoId = await resolverInstrumentoDeMuestra(muestra, req.user.id, t);

      const item = await WorkOrderItem.create({
        orden_trabajo_id: ordenTrabajo.id,
        instrumento_cliente_id: instrumentoId,
        condicion_recepcion: muestra.condicion_recepcion,
      }, { transaction: t });

      muestra.instrumento_cliente_id = instrumentoId;
      muestra.work_order_id = ordenTrabajo.id;
      muestra.work_order_item_id = item.id;
      muestra.estado = 'asignada';
      await muestra.save({ transaction: t });

      return muestra;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'sample',
      entidad_id: muestra.id,
      cambios_nuevos: { estado: 'asignada', work_order: ordenTrabajo.codigo },
      detalles: `Muestra ${muestra.numero_muestra} asignada a la orden de trabajo ${ordenTrabajo.codigo}`,
      ip_address: req.ip,
    });

    logger.info(`[SAMPLES] Muestra ${muestra.numero_muestra} asignada a ${ordenTrabajo.codigo} por ${req.user.email}`);

    const muestraFinal = await Sample.findByPk(resultado.id, { include: SAMPLE_INCLUDES });
    res.json({ success: true, message: `Muestra asignada a la orden de trabajo ${ordenTrabajo.codigo}`, data: muestraFinal });
  } catch (error) {
    logger.error(`[SAMPLES] Error asignando muestra a OT: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'ASSIGN_SAMPLE_ERROR', message: 'Error asignando la muestra a la orden de trabajo' } });
  }
};

exports.createWorkOrderFromSample = async (req, res) => {
  try {
    const { fecha_ingreso, fecha_compromiso, responsable_id, observaciones } = req.body;

    if (!fecha_ingreso) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'La fecha de ingreso es obligatoria' } });
    }

    const muestra = await Sample.findByPk(req.params.id);
    if (!muestra) {
      return res.status(404).json({ success: false, error: { code: 'SAMPLE_NOT_FOUND', message: 'La muestra no existe' } });
    }
    if (muestra.estado !== 'pendiente') {
      return res.status(409).json({ success: false, error: { code: 'SAMPLE_NOT_PENDING', message: 'Esta muestra ya fue asignada o rechazada' } });
    }

    const resultado = await sequelize.transaction(async (t) => {
      const codigo = await WorkOrder.generarCodigo({ transaction: t });

      const ordenTrabajo = await WorkOrder.create({
        codigo,
        cliente_id: muestra.cliente_id,
        fecha_ingreso,
        fecha_compromiso: fecha_compromiso || null,
        responsable_id: responsable_id || null,
        observaciones: observaciones || null,
        creado_por: req.user.id,
      }, { transaction: t });

      const instrumentoId = await resolverInstrumentoDeMuestra(muestra, req.user.id, t);

      const item = await WorkOrderItem.create({
        orden_trabajo_id: ordenTrabajo.id,
        instrumento_cliente_id: instrumentoId,
        condicion_recepcion: muestra.condicion_recepcion,
      }, { transaction: t });

      muestra.instrumento_cliente_id = instrumentoId;
      muestra.work_order_id = ordenTrabajo.id;
      muestra.work_order_item_id = item.id;
      muestra.estado = 'asignada';
      await muestra.save({ transaction: t });

      return ordenTrabajo;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'work_order',
      entidad_id: resultado.id,
      cambios_nuevos: { codigo: resultado.codigo, desde_muestra: muestra.numero_muestra },
      ip_address: req.ip,
    });

    logger.info(`[SAMPLES] OT ${resultado.codigo} creada desde la muestra ${muestra.numero_muestra} por ${req.user.email}`);

    const muestraFinal = await Sample.findByPk(muestra.id, { include: SAMPLE_INCLUDES });
    res.status(201).json({
      success: true,
      message: `Orden de trabajo ${resultado.codigo} creada desde la muestra ${muestra.numero_muestra}`,
      data: muestraFinal,
    });
  } catch (error) {
    logger.error(`[SAMPLES] Error creando OT desde muestra: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_WORK_ORDER_FROM_SAMPLE_ERROR', message: 'Error creando la orden de trabajo desde la muestra' } });
  }
};
