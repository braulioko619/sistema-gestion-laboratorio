const { Op } = require('sequelize');
const {
  Equipment, StabilityAlert, User, Role, AuditLog,
} = require('../models');
const { analizarDerivaEquipo } = require('./DriftAnalysisService');
const emailService = require('./emailService');
const logger = require('../config/logger');

// Tarea 3.5 (D7): job diario que detecta patrones vencidos/por vencer,
// deriva proyectada fuera del error máximo permitido y U creciente, y
// notifica por dashboard (tabla persistida, tarea 3.5) + email.
//
// "No hay duplicados día a día" se resuelve a nivel de dato, no de
// aplicación: como máximo una fila ACTIVA (resuelta_en IS NULL) por
// (tipo, equipment_id, punto_medicion) — índice único parcial
// stability_alerts_una_activa_por_condicion. Si el job vuelve a detectar la
// misma condición sin resolver, actualiza esa fila (ultima_deteccion) sin
// crear una nueva fila y sin reenviar email; solo se emaila cuando aparece
// una alerta que antes no existía o que ya había sido marcada resuelta.
// Ascendente a propósito: nivelVencimiento() usa el primer umbral que
// alcanza, así que debe probar el más ajustado (30) antes que el más
// amplio (90) o siempre devolvería 90.
const UMBRALES_VENCIMIENTO_DIAS = [30, 60, 90];

const CAMPO_PROXIMA = {
  vencimiento_calibracion: 'proxima_calibracion',
  vencimiento_mantenimiento: 'proximo_mantenimiento',
  vencimiento_verificacion: 'proxima_verificacion',
};

const ROLES_NOTIFICADOS = ['administrador', 'jefe_laboratorio'];

function diasEntre(fechaISO, hoy) {
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.round((new Date(fechaISO).getTime() - new Date(hoy).getTime()) / msPorDia);
}

function nivelVencimiento(diasRestantes) {
  if (diasRestantes < 0) return 'vencido';
  const umbral = UMBRALES_VENCIMIENTO_DIAS.find((u) => diasRestantes <= u);
  return umbral ? String(umbral) : null;
}

// Detecta, contra el estado actual de la BD, todas las condiciones que
// deberían tener una alerta activa hoy. No toca stability_alerts todavía —
// eso lo hace reconciliar().
async function detectarCondiciones(hoy) {
  const detectadas = [];

  const equipos = await Equipment.findAll({
    where: { estado: { [Op.notIn]: ['dado_de_baja'] } },
  });

  equipos.forEach((equipo) => {
    Object.entries(CAMPO_PROXIMA).forEach(([tipo, campo]) => {
      const fecha = equipo[campo];
      if (!fecha) return;
      const diasRestantes = diasEntre(fecha, hoy);
      const nivel = nivelVencimiento(diasRestantes);
      if (!nivel) return;
      detectadas.push({
        tipo,
        equipment_id: equipo.id,
        punto_medicion: '',
        nivel,
        mensaje: nivel === 'vencido'
          ? `${equipo.codigo} — ${equipo.nombre}: ${tipo.replace('vencimiento_', '')} vencida el ${fecha}`
          : `${equipo.codigo} — ${equipo.nombre}: ${tipo.replace('vencimiento_', '')} vence el ${fecha} (en ${diasRestantes} días, umbral ${nivel})`,
      });
    });
  });

  const analisisPorEquipo = await Promise.all(
    equipos.map(async (equipo) => ({
      equipo,
      puntos: await analizarDerivaEquipo(equipo.id),
    }))
  );

  analisisPorEquipo.forEach(({ equipo, puntos }) => {
    puntos.forEach((punto) => {
      if (punto.alerta_error_maximo && punto.alerta_error_maximo.supera) {
        detectadas.push({
          tipo: 'deriva',
          equipment_id: equipo.id,
          punto_medicion: punto.punto_medicion,
          nivel: null,
          mensaje: `${equipo.codigo} — ${equipo.nombre} (${punto.punto_medicion}): ${punto.alerta_error_maximo.motivo}`,
        });
      }
      if (punto.alerta_incertidumbre_creciente && punto.alerta_incertidumbre_creciente.creciente) {
        detectadas.push({
          tipo: 'incertidumbre_creciente',
          equipment_id: equipo.id,
          punto_medicion: punto.punto_medicion,
          nivel: null,
          mensaje: `${equipo.codigo} — ${equipo.nombre} (${punto.punto_medicion}): ${punto.alerta_incertidumbre_creciente.motivo}`,
        });
      }
    });
  });

  return detectadas;
}

// Reconcilia lo detectado hoy contra las alertas activas existentes:
// crea las nuevas, actualiza (sin duplicar) las que siguen vigentes, y
// resuelve las que ya no se detectan.
async function reconciliar(detectadas, hoy) {
  const activas = await StabilityAlert.findAll({ where: { resuelta_en: null } });
  const activasPorClave = new Map(
    activas.map((a) => [`${a.tipo}::${a.equipment_id}::${a.punto_medicion}`, a])
  );

  const nuevas = [];
  const clavesDetectadasHoy = new Set();

  for (const d of detectadas) {
    const clave = `${d.tipo}::${d.equipment_id}::${d.punto_medicion}`;
    clavesDetectadasHoy.add(clave);
    const existente = activasPorClave.get(clave);
    if (existente) {
      await existente.update({ ultima_deteccion: hoy, mensaje: d.mensaje, nivel: d.nivel });
    } else {
      const nueva = await StabilityAlert.create({
        ...d,
        primera_deteccion: hoy,
        ultima_deteccion: hoy,
      });
      nuevas.push(nueva);
    }
  }

  const resueltas = [];
  for (const activa of activas) {
    const clave = `${activa.tipo}::${activa.equipment_id}::${activa.punto_medicion}`;
    if (!clavesDetectadasHoy.has(clave)) {
      await activa.update({ resuelta_en: hoy });
      resueltas.push(activa);
    }
  }

  return { nuevas, resueltas };
}

async function notificarPorEmail(nuevas) {
  if (nuevas.length === 0) return { enviado: false };

  const destinatarios = await User.findAll({
    where: { estado: 'activo' },
    include: [{ model: Role, as: 'rol', attributes: ['nombre'], where: { nombre: { [Op.in]: ROLES_NOTIFICADOS } } }],
    attributes: ['id', 'email', 'nombre'],
  });

  if (destinatarios.length === 0) {
    logger.warn('[STABILITY_ALERTS] Hay alertas nuevas pero no hay destinatarios (roles administrador/jefe_laboratorio) activos');
    return { enviado: false };
  }

  const resultado = await emailService.sendStabilityAlertsEmail({
    to: destinatarios.map((u) => u.email),
    alertas: nuevas,
  });

  if (resultado.success) {
    await StabilityAlert.update(
      { email_enviado: true },
      { where: { id: { [Op.in]: nuevas.map((n) => n.id) } } }
    );
  }

  return { enviado: resultado.success, destinatarios: destinatarios.length };
}

// Punto de entrada del job (llamado por el cron diario y por el endpoint
// manual de prueba). Devuelve un resumen para poder verificar en tests /
// llamadas manuales sin tener que releer la tabla aparte.
async function generarAlertasDiarias() {
  const hoy = new Date().toISOString().split('T')[0];

  const detectadas = await detectarCondiciones(hoy);
  const { nuevas, resueltas } = await reconciliar(detectadas, hoy);
  const { enviado, destinatarios } = await notificarPorEmail(nuevas);

  await AuditLog.create({
    usuario_id: null,
    accion: 'crear',
    entidad: 'stability_alert_job',
    detalles: `Job de alertas de estabilidad: ${detectadas.length} condición(es) detectada(s), ${nuevas.length} alerta(s) nueva(s), ${resueltas.length} resuelta(s), email ${enviado ? 'enviado' : 'no enviado'}`,
  });

  logger.info(`[STABILITY_ALERTS] ${detectadas.length} detectadas, ${nuevas.length} nuevas, ${resueltas.length} resueltas, email=${enviado}`);

  return {
    fecha: hoy,
    detectadas: detectadas.length,
    nuevas: nuevas.length,
    resueltas: resueltas.length,
    email_enviado: enviado,
    destinatarios: destinatarios || 0,
  };
}

async function listarAlertasActivas() {
  return StabilityAlert.findAll({
    where: { resuelta_en: null },
    include: [{ model: Equipment, as: 'equipo', attributes: ['id', 'codigo', 'nombre', 'categoria'] }],
    order: [['tipo', 'ASC'], ['ultima_deteccion', 'DESC']],
  });
}

module.exports = {
  generarAlertasDiarias,
  listarAlertasActivas,
  // Exportadas para test unitario de las funciones puras/de detección.
  nivelVencimiento,
  diasEntre,
};
