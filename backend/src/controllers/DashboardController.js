const { WorkOrder, Quote, Client } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const ESTADOS_OT_PIPELINE = [
  'recibida',
  'en_proceso',
  'calibrada',
  'certificado_emitido',
  'lista_para_facturar',
  'entregada',
];

const ESTADOS_COTIZACION = ['borrador', 'emitida', 'aceptada', 'rechazada', 'anulada'];

function primerDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

function primerDiaAnio() {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
}

// Dashboard general del módulo de Calibraciones: OT, cotizaciones, clientes
// y el "proceso" (embudo de etapas por las que pasa una OT de principio a fin).
exports.getCalibracionesDashboard = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = primerDiaMes();
    const inicioAnio = primerDiaAnio();

    const ordenes = await WorkOrder.findAll({
      attributes: ['id', 'estado', 'fecha_compromiso', 'fecha_ingreso'],
      raw: true,
    });

    const porEstadoOT = {};
    ESTADOS_OT_PIPELINE.concat(['cancelada']).forEach((e) => { porEstadoOT[e] = 0; });
    let vencidas = 0;
    ordenes.forEach((o) => {
      porEstadoOT[o.estado] = (porEstadoOT[o.estado] || 0) + 1;
      if (
        o.fecha_compromiso &&
        o.fecha_compromiso < hoy &&
        !['entregada', 'cancelada'].includes(o.estado)
      ) {
        vencidas += 1;
      }
    });

    const funnel = ESTADOS_OT_PIPELINE.map((estado) => ({ estado, cantidad: porEstadoOT[estado] || 0 }));

    const cotizaciones = await Quote.findAll({
      attributes: ['id', 'estado', 'total', 'createdAt'],
      raw: true,
    });
    const porEstadoCotizacion = {};
    ESTADOS_COTIZACION.forEach((e) => { porEstadoCotizacion[e] = 0; });
    let montoAceptadoMes = 0;
    let montoAceptadoAnio = 0;
    cotizaciones.forEach((c) => {
      porEstadoCotizacion[c.estado] = (porEstadoCotizacion[c.estado] || 0) + 1;
      if (c.estado === 'aceptada') {
        const fecha = new Date(c.createdAt).toISOString().split('T')[0];
        if (fecha >= inicioAnio) montoAceptadoAnio += Number(c.total);
        if (fecha >= inicioMes) montoAceptadoMes += Number(c.total);
      }
    });

    const [totalClientes, clientesActivos, clientesNuevosMes] = await Promise.all([
      Client.count(),
      Client.count({ where: { estado: 'activo' } }),
      Client.count({ where: { createdAt: { [Op.gte]: inicioMes } } }),
    ]);

    const [ordenesRecientes, cotizacionesRecientes] = await Promise.all([
      WorkOrder.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ association: 'cliente', attributes: ['id', 'nombre'] }],
      }),
      Quote.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ association: 'cliente', attributes: ['id', 'nombre'] }],
      }),
    ]);

    res.json({
      success: true,
      data: {
        ordenes_trabajo: {
          total: ordenes.length,
          por_estado: porEstadoOT,
          vencidas,
          recientes: ordenesRecientes,
        },
        cotizaciones: {
          total: cotizaciones.length,
          por_estado: porEstadoCotizacion,
          monto_aceptado_mes: Math.round(montoAceptadoMes * 100) / 100,
          monto_aceptado_anio: Math.round(montoAceptadoAnio * 100) / 100,
          recientes: cotizacionesRecientes,
        },
        clientes: {
          total: totalClientes,
          activos: clientesActivos,
          inactivos: totalClientes - clientesActivos,
          nuevos_mes: clientesNuevosMes,
        },
        procesos: { funnel },
      },
    });
  } catch (error) {
    logger.error(`[DASHBOARD] Error obteniendo dashboard de calibraciones: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_DASHBOARD_ERROR', message: 'Error obteniendo el dashboard' } });
  }
};
