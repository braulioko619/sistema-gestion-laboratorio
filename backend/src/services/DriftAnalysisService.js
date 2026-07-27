const { Op, fn, col } = require('sequelize');
const { StandardCalibrationHistory, Equipment } = require('../models');

// Análisis de deriva de patrones (tarea 3.4, D7): regresión lineal simple
// por mínimos cuadrados sobre valor_certificado vs. tiempo, con los tres
// criterios que D7 exige además de la pendiente sola (que D7 mismo señala
// como insuficiente):
// (a) mínimo 3 calibraciones antes de reportar una pendiente,
// (b) la desviación proyectada se compara contra equipment.error_maximo_permitido,
// (c) alerta si la incertidumbre del último certificado creció respecto al
//     promedio histórico.
const MS_POR_DIA = 24 * 60 * 60 * 1000;
const MIN_PUNTOS_PARA_REGRESION = 3;
// Si el equipo no tiene proxima_calibracion fijada, se proyecta un año
// después de la última calibración conocida — un supuesto explícito
// documentado, no una regla de negocio dura (D7 no especifica un horizonte).
const DIAS_PROYECCION_POR_DEFECTO = 365;

// Regresión lineal por mínimos cuadrados: y = intercepto + pendiente * x.
// Función pura, sin I/O — así el criterio de aceptación de la tarea 3.4
// ("con datos sintéticos conocidos, la pendiente calculada coincide") se
// puede probar de forma aislada, sin base de datos.
function regresionLineal(puntosXY) {
  const n = puntosXY.length;
  const xMean = puntosXY.reduce((s, p) => s + p.x, 0) / n;
  const yMean = puntosXY.reduce((s, p) => s + p.y, 0) / n;
  let numerador = 0;
  let denominador = 0;
  puntosXY.forEach((p) => {
    numerador += (p.x - xMean) * (p.y - yMean);
    denominador += (p.x - xMean) ** 2;
  });
  const pendiente = denominador === 0 ? 0 : numerador / denominador;
  const intercepto = yMean - pendiente * xMean;
  return { pendiente, intercepto };
}

// Criterio (c) de D7: compara la U del certificado más reciente contra el
// promedio de los certificados anteriores del mismo punto.
function evaluarIncertidumbreCreciente(historial) {
  if (historial.length < 2) {
    return { creciente: false, motivo: 'No hay suficiente historial para comparar la incertidumbre' };
  }
  const anteriores = historial.slice(0, -1).map((h) => Number(h.incertidumbre_U));
  const ultima = Number(historial[historial.length - 1].incertidumbre_U);
  const promedioAnteriores = anteriores.reduce((s, v) => s + v, 0) / anteriores.length;
  const creciente = ultima > promedioAnteriores;
  return {
    creciente,
    ultima_U: ultima,
    promedio_U_anterior: promedioAnteriores,
    motivo: creciente
      ? `La incertidumbre del último certificado (${ultima}) es mayor que el promedio histórico (${promedioAnteriores.toFixed(6)})`
      : `La incertidumbre del último certificado (${ultima}) no creció respecto al promedio histórico (${promedioAnteriores.toFixed(6)})`,
  };
}

async function analizarPunto(equipo, puntoMedicion) {
  const historial = await StandardCalibrationHistory.findAll({
    where: { equipment_id: equipo.id, punto_medicion: puntoMedicion },
    order: [['fecha_calibracion', 'ASC']],
  });

  const cantidadPuntos = historial.length;
  const historialFormateado = historial.map((h) => ({
    fecha_calibracion: h.fecha_calibracion,
    valor_certificado: Number(h.valor_certificado),
    valor_nominal: h.valor_nominal === null ? null : Number(h.valor_nominal),
    incertidumbre_U: Number(h.incertidumbre_U),
    unidad: h.unidad,
  }));

  const base = {
    punto_medicion: puntoMedicion,
    cantidad_puntos: cantidadPuntos,
    suficientes_datos: cantidadPuntos >= MIN_PUNTOS_PARA_REGRESION,
    historial: historialFormateado,
    alerta_incertidumbre_creciente: evaluarIncertidumbreCreciente(historial),
  };

  if (!base.suficientes_datos) {
    return {
      ...base,
      pendiente: null,
      intercepto: null,
      motivo_insuficiente: `Se requieren al menos ${MIN_PUNTOS_PARA_REGRESION} calibraciones para calcular una tendencia (hay ${cantidadPuntos})`,
      proyeccion: null,
      alerta_error_maximo: null,
    };
  }

  const fechaBaseMs = new Date(historial[0].fecha_calibracion).getTime();
  const puntosXY = historial.map((h) => ({
    x: (new Date(h.fecha_calibracion).getTime() - fechaBaseMs) / MS_POR_DIA,
    y: Number(h.valor_certificado),
  }));
  const { pendiente, intercepto } = regresionLineal(puntosXY);

  const ultimaFechaMs = new Date(historial[historial.length - 1].fecha_calibracion).getTime();
  const usaProximaCalibracionDelEquipo = Boolean(equipo.proxima_calibracion);
  const fechaProyeccionMs = usaProximaCalibracionDelEquipo
    ? new Date(equipo.proxima_calibracion).getTime()
    : ultimaFechaMs + DIAS_PROYECCION_POR_DEFECTO * MS_POR_DIA;
  const xProyeccion = (fechaProyeccionMs - fechaBaseMs) / MS_POR_DIA;
  const valorProyectado = intercepto + pendiente * xProyeccion;

  const valorNominal = historial[historial.length - 1].valor_nominal !== null
    ? Number(historial[historial.length - 1].valor_nominal)
    : null;

  let alertaErrorMaximo = null;
  if (equipo.error_maximo_permitido !== null && equipo.error_maximo_permitido !== undefined && valorNominal !== null) {
    const desviacionProyectada = Math.abs(valorProyectado - valorNominal);
    const emp = Number(equipo.error_maximo_permitido);
    alertaErrorMaximo = {
      desviacion_proyectada: desviacionProyectada,
      error_maximo_permitido: emp,
      supera: desviacionProyectada > emp,
      motivo: desviacionProyectada > emp
        ? `La desviación proyectada (${desviacionProyectada.toFixed(6)}) supera el error máximo permitido (${emp})`
        : `La desviación proyectada (${desviacionProyectada.toFixed(6)}) está dentro del error máximo permitido (${emp})`,
    };
  }

  return {
    ...base,
    pendiente,
    intercepto,
    unidad_x: 'días',
    proyeccion: {
      fecha: new Date(fechaProyeccionMs).toISOString().split('T')[0],
      valor_proyectado: valorProyectado,
      fuente_fecha: usaProximaCalibracionDelEquipo ? 'proxima_calibracion_del_equipo' : `${DIAS_PROYECCION_POR_DEFECTO}_dias_desde_la_ultima_calibracion`,
    },
    alerta_error_maximo: alertaErrorMaximo,
  };
}

// Analiza un punto puntual, o todos los puntos distintos calibrados del
// equipo si no se especifica ninguno.
async function analizarDerivaEquipo(equipmentId, puntoMedicion) {
  const equipo = await Equipment.findByPk(equipmentId);
  if (!equipo) {
    const error = new Error('El patrón no existe');
    error.code = 'EQUIPMENT_NOT_FOUND';
    throw error;
  }

  if (puntoMedicion) {
    return [await analizarPunto(equipo, puntoMedicion)];
  }

  const filas = await StandardCalibrationHistory.findAll({
    where: { equipment_id: equipo.id },
    attributes: [[fn('DISTINCT', col('punto_medicion')), 'punto_medicion']],
    raw: true,
  });

  return Promise.all(filas.map((f) => analizarPunto(equipo, f.punto_medicion)));
}

module.exports = { analizarDerivaEquipo, regresionLineal };
