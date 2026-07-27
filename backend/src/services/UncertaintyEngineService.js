// Tarea 4.1/4.2 (docs/PLAN_4.1_MOTOR_GUM.md): motor de incertidumbre GUM,
// instrumento piloto Pie de Metros — 4.1 cubrió "Topes de Exteriores", 4.2
// agrega las otras 3 secciones del mismo instrumento (Interiores,
// Profundímetro, Escalón), antes de extender a otro tipo de instrumento.
//
// Replica DELIBERADAMENTE el comportamiento real de la planilla de
// producción del laboratorio (planilla_pie_de_metro.xlsx, hoja "Calculos"),
// decisión del dueño del proyecto 2026-07-25 — incluidas sus
// inconsistencias frente al procedimiento PRO-L01 (documentadas una por una
// abajo, con la celda exacta de origen). No es una implementación "correcta"
// de GUM de libro de texto; es una implementación fiel de lo que el
// laboratorio realmente calcula hoy en certificados reales.
//
// Las 4 secciones (Exteriores filas 9-18, Interiores 24-25, Profundímetro
// 32-33, Escalón 39-40) comparten EXACTAMENTE la misma fórmula de 6
// componentes (paralelismo/repetibilidad/resolución/patrón/temperatura×2) y
// el mismo criterio de "resultado nunca menor que el CMC". La única
// diferencia real entre secciones es cómo se calcula la "lectura promedio"
// (columna P): Exteriores/Profundímetro/Escalón usan MROUND a la
// resolución; Interiores usa el promedio simple, sin redondear, más una
// "constante de tope" opcional del instrumento (Registro!F19/F20) —
// verificado celda por celda contra el .xlsx antes de escribir este código,
// no asumido por similitud.
//
// Mismo patrón de 4 piezas que DriftAnalysisService.js/ControlChartService.js:
// (a) constantes de referencia embebidas, (b) función(es) pura(s) de
// cálculo, (c) función async por-punto, (d) función pública que resuelve
// el ítem.

const {
  WorkOrderItem, CalibrationFormEntry, CalibrationFormTemplateVersion,
} = require('../models');

// Coeficiente de dilatación térmica lineal del acero (Calculos!M9/N9: 0.0000115
// y 11.5*10^-6 son el mismo número, la planilla los escribe dos veces con
// distinta precisión de texto — ver más abajo por qué ambos se usan).
const COEF_DILATACION_ACERO = 11.5e-6;

// Factor tipo Student-t para n=4 lecturas (df=3), tal como lo calcula
// Calculos!G10 (=ROUND(T.INV(1-(1-(1-(1-NORM.S.DIST(1,TRUE()))*2))/2,4-1),1)).
// La expresión anidada se reduce algebraicamente a T.INV(NORM.S.DIST(1,TRUE()),3)
// — el valor t-Student con la misma probabilidad acumulada que z=1 en la
// normal estándar, redondeado a 1 decimal. Es una constante fija (no depende
// de los datos de entrada); se computó una sola vez fuera de Node con la
// librería `jstat` (T.INV(0.8413447460685429, 3) = 1.1968813330402344,
// redondeado a 1 decimal = 1.2) y se deja aquí como literal, documentado,
// en vez de sumar una dependencia de estadística al proyecto solo para un
// valor que nunca cambia.
const FACTOR_STUDENT_N4 = 1.2;

// Tabla de patrones (Calculos!B54:F82), columna "Incert. Final" (F) —
// exactamente la que usa Calculos!L9/L24/L32/L39 vía OFFSET/MATCH (misma
// tabla compartida por las 4 secciones), NO la columna I
// ("Certificado + Deriva") pese a que el encabezado L6 dice "PATRÓN
// (Cert.+Deriva)". Es un componente ya en mm, no requiere dividir por
// √3 ni por k — se usa tal cual en la suma de cuadrados de O.
// Set Bloques Cortos: rango 0-100mm.
const PATRONES_BLOQUES_CORTOS = {
  0: 0.00023, 1: 0.00022, 5.1: 0.00015, 5.5: 0.00017, 10.3: 0.00014,
  20: 0.00018, 25: 0.00018, 50: 0.00021, 75: 0.00084, 100: 0.0005,
};
// Set Bloques Largos: rango 125-1500mm.
const PATRONES_BLOQUES_LARGOS = {
  125: 0.000300125, 130: 0.00032013, 150: 0.00077015, 175: 0.000400175,
  200: 0.0013502, 250: 0.00080025, 300: 0.0003003, 400: 0.0010004,
  450: 0.00060045, 500: 0.0003505, 600: 0.0003706, 750: 0.00065075,
  800: 0.0004508, 1000: 0.001451, 1500: 0.0017815,
};

// CMC (capacidad de medición mínima acreditada), 8 combinaciones
// (tipo instrumento × resolución), extraídas de la hoja CMC (celdas
// I28/I39/I50/I64/I75/I104/I115/I126) — valores fijos evaluados a la
// longitud de referencia del rango del instrumento (Registro!$D$20), y
// compartidos por las 4 secciones (misma columna R/S en cada una).
const CMC_PIE_DE_METRO = {
  analogo: { 0.1: 0.11582174238239268, 0.05: 0.058435229172934144, 0.02: 0.024792660375468654, 0.01: 0.014651826114629308 },
  digital: { 0.1: 0.058435229172934144, 0.05: 0.030243611035941684, 0.02: 0.014651826114629308, 0.01: 0.010708688458132179 },
};

const SECCIONES_VALIDAS = ['exterior', 'interior', 'profundidad', 'escalon'];

function buscarPatron(valorNominal) {
  if (Object.prototype.hasOwnProperty.call(PATRONES_BLOQUES_CORTOS, valorNominal)) {
    return PATRONES_BLOQUES_CORTOS[valorNominal];
  }
  if (Object.prototype.hasOwnProperty.call(PATRONES_BLOQUES_LARGOS, valorNominal)) {
    return PATRONES_BLOQUES_LARGOS[valorNominal];
  }
  const error = new Error(`No hay patrón registrado para el valor nominal ${valorNominal}mm (mismo comportamiento que MATCH exacto en la planilla real: solo existen los rangos de los bloques patrones físicos del laboratorio)`);
  error.code = 'PATRON_NO_ENCONTRADO';
  throw error;
}

function buscarCMC(tipoInstrumento, resolucion) {
  const tabla = CMC_PIE_DE_METRO[tipoInstrumento];
  if (!tabla || tabla[resolucion] === undefined) {
    const error = new Error(`No hay CMC definido para tipo="${tipoInstrumento}" resolución=${resolucion}mm`);
    error.code = 'CMC_NO_ENCONTRADO';
    throw error;
  }
  return tabla[resolucion];
}

function stdevMuestral(valores) {
  const n = valores.length;
  const media = valores.reduce((s, v) => s + v, 0) / n;
  const sumaCuadrados = valores.reduce((s, v) => s + (v - media) ** 2, 0);
  return Math.sqrt(sumaCuadrados / (n - 1));
}

// Redondeo al múltiplo de "resolucion" más cercano (equivalente a
// Excel MROUND), replicando Calculos!P9/P32/P39 (Exteriores/Profundímetro/
// Escalón). Interiores NO usa esto — ver calcularLecturaPromedio().
function mround(valor, resolucion) {
  return Math.round(valor / resolucion) * resolucion;
}

// Calculos!P9 vs P24: la única diferencia real entre secciones. Exteriores/
// Profundímetro/Escalón: MROUND(promedio, resolución). Interiores:
// promedio simple SIN redondear, más una "constante de tope" opcional
// (Registro!F19="Si" -> suma Registro!F20) — el calibre de interiores no
// necesariamente parte de cero en sus mordazas, así que el instrumento
// puede llevar un offset fijo grabado.
function calcularLecturaPromedio(seccion, lecturas, resolucion, constanteDeTope) {
  const promedio = lecturas.reduce((s, v) => s + v, 0) / lecturas.length;
  if (seccion === 'interior') {
    const { tiene = false, valor = 0 } = constanteDeTope || {};
    return tiene ? promedio + valor : promedio;
  }
  return mround(promedio, resolucion);
}

// Función pura, sin I/O — el corazón del motor, compartido por las 4
// secciones de Pie de Metros (Calculos!I:V de cada sección). Recibe
// `seccion` para (a) elegir el criterio de lectura promedio correcto y
// (b) dejarlo en el resultado, para trazabilidad de qué midió cada punto.
//
// paralelismo: { puntaMedioFondo: [p, m, f], referencia } — mismo criterio
// que Registro!B41:D41 vs A41 (bloque patrón de referencia, 100/150/200mm
// según el rango del instrumento; el mismo valor se reutiliza para las 4
// secciones, no se remide por sección — así lo hace la planilla real).
// constanteDeTope: { tiene: boolean, valor: number } — solo relevante para
// seccion='interior'; se ignora en las demás.
function calcularIncertidumbrePieDeMetro({
  seccion, valorNominal, lecturas, resolucion, tipoInstrumento, paralelismo, constanteDeTope,
}) {
  if (!SECCIONES_VALIDAS.includes(seccion)) {
    throw Object.assign(new Error(`seccion debe ser una de: ${SECCIONES_VALIDAS.join(', ')}`), { code: 'VALIDATION_ERROR' });
  }
  if (!Array.isArray(lecturas) || lecturas.length !== 4) {
    throw Object.assign(new Error('Se requieren exactamente 4 lecturas (mismo criterio que la planilla real, columnas C:F)'), { code: 'VALIDATION_ERROR' });
  }

  const patronIncertidumbre = buscarPatron(valorNominal);
  const cmc = buscarCMC(tipoInstrumento, resolucion);

  // Repetibilidad (Tipo A): STDEV.S(lecturas)/SQRT(n)*G
  const s = stdevMuestral(lecturas);
  const u_repetibilidad = (s / Math.sqrt(lecturas.length)) * FACTOR_STUDENT_N4;

  // Resolución (Tipo B)
  const u_resolucion = tipoInstrumento === 'analogo'
    ? resolucion / Math.sqrt(3)
    : resolucion / (2 * Math.sqrt(3));

  // Paralelismo de caras (Tipo B): Registro!$E$41/SQRT(3), donde
  // Registro!E41 = MAX(|ref-punta|, |ref-medio|, |ref-fondo|).
  const { referencia, puntaMedioFondo } = paralelismo;
  const errorParalelismo = Math.max(...puntaMedioFondo.map((lectura) => Math.abs(referencia - lectura)));
  const u_paralelismo = errorParalelismo / Math.sqrt(3);

  // Patrón (Tipo B): usado tal cual, sin dividir más.
  const u_patron = patronIncertidumbre;

  // Temperatura, DOS veces (Tipo B). La planilla real sí suma ambas en
  // O=SQRT(SUMSQ(...)) — ver docs/PLAN_4.1_MOTOR_GUM.md sección 8,
  // hallazgo 1. Replicado a propósito, no es un error de este servicio.
  const u_temperatura_1 = valorNominal * COEF_DILATACION_ACERO * (1 / Math.sqrt(3));
  const u_temperatura_2 = COEF_DILATACION_ACERO * valorNominal;

  // Combinada: SQRT(SUMSQ(...)) — 6 componentes.
  const incertidumbreCombinada = Math.sqrt(
    u_paralelismo ** 2
    + u_repetibilidad ** 2
    + u_resolucion ** 2
    + u_patron ** 2
    + u_temperatura_1 ** 2
    + u_temperatura_2 ** 2
  );

  // Expandida k=2.
  const incertidumbreExpandida = incertidumbreCombinada * 2;

  // Resultado final: nunca menos que el CMC.
  const incertidumbreFinal = Math.max(incertidumbreExpandida, cmc);

  const lecturaPromedio = calcularLecturaPromedio(seccion, lecturas, resolucion, constanteDeTope);
  const errorIndicacion = lecturaPromedio - valorNominal;

  return {
    seccion,
    valor_nominal: valorNominal,
    lecturas,
    lectura_promedio: lecturaPromedio,
    error_indicacion: errorIndicacion,
    componentes: {
      paralelismo: u_paralelismo,
      repetibilidad: u_repetibilidad,
      resolucion: u_resolucion,
      patron: u_patron,
      temperatura_1: u_temperatura_1,
      temperatura_2: u_temperatura_2,
    },
    incertidumbre_combinada: incertidumbreCombinada,
    incertidumbre_expandida: incertidumbreExpandida,
    cmc,
    incertidumbre_final: incertidumbreFinal,
    factor_k: 2,
  };
}

// Compatibilidad con la tarea 4.1: alias fijado a seccion='exterior' (firma
// original, ya cubierta por tests/E2E existentes).
function calcularIncertidumbrePieDeMetroExterior({ valorNominal, lecturas, resolucion, tipoInstrumento, paralelismo }) {
  return calcularIncertidumbrePieDeMetro({
    seccion: 'exterior', valorNominal, lecturas, resolucion, tipoInstrumento, paralelismo,
  });
}

// Async: trae la captura confirmada del ítem (tarea 3.2), arma los puntos a
// calcular, llama a la función pura por cada uno, y escribe el resultado en
// work_order_items.puntos (por punto) + incertidumbre_U/factor_k a nivel de
// ítem (el máximo entre los puntos calculados — es lo que
// CertificateIssuanceService/CalibrationCertificateController ya consumen
// para el checklist de emisión, sin tocar ese código).
async function calcularIncertidumbreItem(workOrderItemId) {
  const item = await WorkOrderItem.findByPk(workOrderItemId);
  if (!item) {
    const error = new Error('El ítem de la orden de trabajo no existe');
    error.code = 'WORK_ORDER_ITEM_NOT_FOUND';
    throw error;
  }

  const entradas = await CalibrationFormEntry.findAll({
    where: { work_order_item_id: workOrderItemId, estado: 'confirmado' },
    include: [{ model: CalibrationFormTemplateVersion, as: 'versionPlantilla' }],
    order: [['fecha_captura', 'ASC']],
  });

  if (entradas.length === 0) {
    const error = new Error('No hay capturas confirmadas para este ítem (tarea 3.2) — nada que calcular todavía');
    error.code = 'NO_CONFIRMED_FORM_ENTRY';
    throw error;
  }

  const puntos = entradas.map((entrada) => {
    const d = entrada.data;
    return calcularIncertidumbrePieDeMetro({
      seccion: d.seccion || 'exterior',
      valorNominal: Number(d.valor_nominal),
      lecturas: d.lecturas.map(Number),
      resolucion: Number(d.resolucion),
      tipoInstrumento: d.tipo_instrumento,
      paralelismo: {
        referencia: Number(d.paralelismo.referencia),
        puntaMedioFondo: d.paralelismo.puntaMedioFondo.map(Number),
      },
      constanteDeTope: d.constante_de_tope
        ? { tiene: Boolean(d.constante_de_tope.tiene), valor: Number(d.constante_de_tope.valor || 0) }
        : undefined,
    });
  });

  const incertidumbreU = Math.max(...puntos.map((p) => p.incertidumbre_final));

  await item.update({
    puntos,
    incertidumbre_U: incertidumbreU,
    factor_k: 2,
    fuente_datos: 'digitacion',
  });

  return { puntos, incertidumbre_U: incertidumbreU, factor_k: 2 };
}

module.exports = {
  calcularIncertidumbrePieDeMetro,
  calcularIncertidumbrePieDeMetroExterior,
  calcularIncertidumbreItem,
};
