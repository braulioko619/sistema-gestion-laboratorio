const { ServiceVisit, WorkOrder, Client, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const ESTADOS_VALIDOS = ['programada', 'confirmada', 'en_curso', 'completada', 'cancelada'];
const MODALIDADES_VALIDAS = ['terreno', 'laboratorio'];

const VISIT_INCLUDES = [
  { model: WorkOrder, as: 'ordenTrabajo', attributes: ['id', 'codigo', 'estado'] },
  { model: Client, as: 'cliente', attributes: ['id', 'nombre', 'direccion', 'telefono'] },
  { model: User, as: 'tecnico', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre'] },
];

exports.getVisits = async (req, res) => {
  try {
    const { desde, hasta, tecnico_id, estado, cliente_id } = req.query;
    const where = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }
    if (tecnico_id) where.tecnico_id = tecnico_id;
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;

    const visitas = await ServiceVisit.findAll({
      where,
      include: VISIT_INCLUDES,
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
    });

    res.json({ success: true, data: visitas });
  } catch (error) {
    logger.error(`[SERVICE_VISITS] Error listando servicios agendados: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_SERVICE_VISITS_ERROR', message: 'Error obteniendo los servicios agendados' } });
  }
};

exports.getVisitById = async (req, res) => {
  try {
    const visita = await ServiceVisit.findByPk(req.params.id, { include: VISIT_INCLUDES });
    if (!visita) {
      return res.status(404).json({ success: false, error: { code: 'VISIT_NOT_FOUND', message: 'El servicio agendado no existe' } });
    }
    res.json({ success: true, data: visita });
  } catch (error) {
    logger.error(`[SERVICE_VISITS] Error obteniendo servicio agendado: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_SERVICE_VISIT_ERROR', message: 'Error obteniendo el servicio agendado' } });
  }
};

exports.createVisit = async (req, res) => {
  try {
    const {
      work_order_id, cliente_id, tecnico_id, fecha, hora_inicio, hora_fin,
      lugar, modalidad, distancia_km, tiempo_traslado_horas, motivo, comentarios,
    } = req.body;

    if (!fecha || !hora_inicio) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'La fecha y la hora de inicio son obligatorias' } });
    }
    if (!tecnico_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Debe asignarse un técnico al servicio' } });
    }
    if (!work_order_id && !motivo) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Debe indicar la orden de trabajo o un motivo del servicio' } });
    }
    if (modalidad && !MODALIDADES_VALIDAS.includes(modalidad)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `La modalidad debe ser una de: ${MODALIDADES_VALIDAS.join(', ')}` } });
    }

    let clienteFinal = cliente_id || null;
    let ordenTrabajo = null;
    if (work_order_id) {
      ordenTrabajo = await WorkOrder.findByPk(work_order_id);
      if (!ordenTrabajo) {
        return res.status(404).json({ success: false, error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' } });
      }
      clienteFinal = ordenTrabajo.cliente_id;
    }

    const visita = await ServiceVisit.create({
      work_order_id: work_order_id || null,
      cliente_id: clienteFinal,
      tecnico_id,
      fecha,
      hora_inicio,
      hora_fin: hora_fin || null,
      lugar: lugar || null,
      modalidad: modalidad || 'terreno',
      distancia_km: distancia_km || null,
      tiempo_traslado_horas: tiempo_traslado_horas || null,
      motivo: motivo || null,
      comentarios: comentarios || null,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'service_visit',
      entidad_id: visita.id,
      cambios_nuevos: { fecha, hora_inicio, tecnico_id, work_order_id: work_order_id || null },
      ip_address: req.ip,
    });

    logger.info(`[SERVICE_VISITS] Servicio agendado el ${fecha} ${hora_inicio} por ${req.user.email}`);

    const resultado = await ServiceVisit.findByPk(visita.id, { include: VISIT_INCLUDES });
    res.status(201).json({ success: true, message: 'Servicio agendado correctamente', data: resultado });
  } catch (error) {
    logger.error(`[SERVICE_VISITS] Error agendando servicio: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_SERVICE_VISIT_ERROR', message: 'Error agendando el servicio' } });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const visita = await ServiceVisit.findByPk(req.params.id);
    if (!visita) {
      return res.status(404).json({ success: false, error: { code: 'VISIT_NOT_FOUND', message: 'El servicio agendado no existe' } });
    }

    if (req.body.estado !== undefined && !ESTADOS_VALIDOS.includes(req.body.estado)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` } });
    }
    if (req.body.modalidad !== undefined && !MODALIDADES_VALIDAS.includes(req.body.modalidad)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `La modalidad debe ser una de: ${MODALIDADES_VALIDAS.join(', ')}` } });
    }

    if (req.body.work_order_id) {
      const ordenTrabajo = await WorkOrder.findByPk(req.body.work_order_id);
      if (!ordenTrabajo) {
        return res.status(404).json({ success: false, error: { code: 'WORK_ORDER_NOT_FOUND', message: 'La orden de trabajo no existe' } });
      }
      if (req.body.cliente_id === undefined) req.body.cliente_id = ordenTrabajo.cliente_id;
    }

    const camposPermitidos = [
      'work_order_id', 'cliente_id', 'tecnico_id', 'fecha', 'hora_inicio', 'hora_fin',
      'lugar', 'modalidad', 'distancia_km', 'tiempo_traslado_horas', 'motivo', 'comentarios', 'estado',
    ];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== visita[campo]) {
        cambiosAnteriores[campo] = visita[campo];
        cambiosNuevos[campo] = req.body[campo];
        visita[campo] = req.body[campo];
      }
    });

    await visita.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'service_visit',
        entidad_id: visita.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[SERVICE_VISITS] Servicio agendado ${visita.id} actualizado por ${req.user.email}`);

    const resultado = await ServiceVisit.findByPk(visita.id, { include: VISIT_INCLUDES });
    res.json({ success: true, message: 'Servicio actualizado correctamente', data: resultado });
  } catch (error) {
    logger.error(`[SERVICE_VISITS] Error actualizando servicio agendado: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_SERVICE_VISIT_ERROR', message: 'Error actualizando el servicio agendado' } });
  }
};
