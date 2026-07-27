const { fn, col } = require('sequelize');
const { StandardCalibrationHistory, Equipment } = require('../models');

// Tarea 4.4 (D7, "alternativa adicional"): carta de control de valores
// individuales (Shewhart X-chart) por equipo+punto, como segunda vista de
// estabilidad complementaria a la regresión lineal de DriftAnalysisService
// (tarea 3.4). Una carta de control no busca tendencia (eso ya lo hace la
// regresión) sino detectar valores puntuales fuera de los límites de
// variación esperada del propio patrón.
//
// Se usa el método de rangos móviles (moving range, n=2) porque cada
// calibración es una medición individual, no un subgrupo — es el método
// estándar para cartas X individuales cuando no hay repeticiones por fecha.
// d2 = 1.128 es la constante estadística estándar para estimar sigma a
// partir del rango móvil de a pares (tablas de control de Shewhart).
const D2_RANGO_MOVIL_N2 = 1.128;
const MIN_PUNTOS_CARTA_CONTROL = 3;

function calcularLimites(valores) {
  const n = valores.length;
  const media = valores.reduce((s, v) => s + v, 0) / n;

  const rangosMoviles = [];
  for (let i = 1; i < n; i += 1) {
    rangosMoviles.push(Math.abs(valores[i] - valores[i - 1]));
  }
  const rangoMovilPromedio = rangosMoviles.reduce((s, r) => s + r, 0) / rangosMoviles.length;
  const sigma = rangoMovilPromedio / D2_RANGO_MOVIL_N2;

  return {
    media,
    sigma,
    limite_superior: media + 3 * sigma,
    limite_inferior: media - 3 * sigma,
    rango_movil_promedio: rangoMovilPromedio,
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
    unidad: h.unidad,
  }));

  const base = {
    punto_medicion: puntoMedicion,
    cantidad_puntos: cantidadPuntos,
    suficientes_datos: cantidadPuntos >= MIN_PUNTOS_CARTA_CONTROL,
    historial: historialFormateado,
  };

  if (!base.suficientes_datos) {
    return {
      ...base,
      limites: null,
      puntos_fuera_de_control: [],
      motivo_insuficiente: `Se requieren al menos ${MIN_PUNTOS_CARTA_CONTROL} calibraciones para trazar una carta de control (hay ${cantidadPuntos})`,
    };
  }

  const valores = historialFormateado.map((h) => h.valor_certificado);
  const limites = calcularLimites(valores);

  const puntosFueraDeControl = historialFormateado
    .filter((h) => h.valor_certificado > limites.limite_superior || h.valor_certificado < limites.limite_inferior)
    .map((h) => ({
      fecha_calibracion: h.fecha_calibracion,
      valor_certificado: h.valor_certificado,
      motivo: h.valor_certificado > limites.limite_superior
        ? `Supera el límite de control superior (${limites.limite_superior.toFixed(6)})`
        : `Por debajo del límite de control inferior (${limites.limite_inferior.toFixed(6)})`,
    }));

  return {
    ...base,
    limites,
    puntos_fuera_de_control: puntosFueraDeControl,
  };
}

async function analizarCartaControlEquipo(equipmentId, puntoMedicion) {
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

module.exports = { analizarCartaControlEquipo, calcularLimites };
