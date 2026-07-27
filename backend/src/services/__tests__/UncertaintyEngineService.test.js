const { calcularIncertidumbrePieDeMetroExterior, calcularIncertidumbrePieDeMetro } = require('../UncertaintyEngineService');

// Tarea 4.1: prueba solo la función pura (sin BD). El caso de referencia NO
// se tomó de `PL 06-F01 Validación de planilla de calculo pie de metros.pdf`
// — al leer ese documento con cuidado (ver docs/PLAN_4.1_MOTOR_GUM.md,
// sección 8) resultó validar una versión ANTERIOR y más simple de la
// fórmula (4 componentes, sin paralelismo, sin el factor Student-t de
// repetibilidad), distinta de la que la hoja "Calculos" calcula hoy en
// producción (6 componentes). Usarlo como oráculo habría estado validando
// la fórmula equivocada.
//
// En su lugar, el caso de referencia se construyó calculando A MANO, fuera
// de este servicio, cada componente de la fórmula real (Calculos!I9:V9)
// para un punto nominal de 150mm, usando datos reales extraídos del propio
// libro (`planilla_pie_de_metro.xlsx`, tabla de patrones fila B69 y CMC
// Digital/0.01mm) más lecturas y paralelismo sintéticos elegidos para esta
// prueba. El detalle aritmético completo (mismo criterio que las pruebas de
// DriftAnalysisService/ControlChartService) queda documentado componente a
// componente abajo.
describe('calcularIncertidumbrePieDeMetroExterior', () => {
  test('punto de 150mm, instrumento digital 0.01mm: cada componente coincide con el cálculo de referencia', () => {
    const resultado = calcularIncertidumbrePieDeMetroExterior({
      valorNominal: 150.0,
      lecturas: [150.00, 150.01, 150.01, 150.00],
      resolucion: 0.01,
      tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
    });

    // Repetibilidad: s = STDEV.S([150.00,150.01,150.01,150.00]) = 0.0057735...
    // u_rep = s/√4 * 1.2 (factor Student-t, n=4, ver comentario en el
    // servicio) = 0.0028868 * 1.2 = 0.0034641
    expect(resultado.componentes.repetibilidad).toBeCloseTo(0.0034641016, 8);

    // Resolución (digital): 0.01/(2√3) = 0.0028867513
    expect(resultado.componentes.resolucion).toBeCloseTo(0.0028867513, 8);

    // Paralelismo: max(|100-100.00|, |100-100.00|, |100-99.99|)/√3 = 0.01/√3 = 0.0057735027
    expect(resultado.componentes.paralelismo).toBeCloseTo(0.0057735027, 8);

    // Patrón: tabla real de Bloques Largos, fila B=150mm, columna F
    // (Calculos!F69 = 0.00077015mm exacto, extraído directo del .xlsx)
    expect(resultado.componentes.patron).toBeCloseTo(0.00077015, 8);

    // Temperatura 1: 150 * 11.5e-6 * (1/√3) = 0.0009959292
    expect(resultado.componentes.temperatura_1).toBeCloseTo(0.0009959292, 8);
    // Temperatura 2 (duplicada a propósito): 11.5e-6 * 150 = 0.001725
    expect(resultado.componentes.temperatura_2).toBeCloseTo(0.001725, 8);

    // Combinada = sqrt(suma de cuadrados de los 6 componentes) = 0.0076307 (calculado independiente en Node antes de escribir el servicio)
    expect(resultado.incertidumbre_combinada).toBeCloseTo(0.0076306813, 6);
    // Expandida k=2
    expect(resultado.incertidumbre_expandida).toBeCloseTo(0.0152613627, 6);
    // CMC real (Digital, 0.01mm) = CMC!I64 = 0.010708688458132179
    expect(resultado.cmc).toBeCloseTo(0.0107086885, 8);
    // Expandida (0.01526) > CMC (0.01071) -> resultado final es la expandida
    expect(resultado.incertidumbre_final).toBeCloseTo(resultado.incertidumbre_expandida, 10);
    expect(resultado.factor_k).toBe(2);

    // Error de indicación: MROUND(promedio(lecturas), 0.01) - 150.0
    // promedio = 150.005 -> MROUND a 0.01 = 150.01 -> error = 0.01
    expect(resultado.lectura_promedio).toBeCloseTo(150.01, 8);
    expect(resultado.error_indicacion).toBeCloseTo(0.01, 8);
  });

  test('cuando la incertidumbre expandida calculada es menor que el CMC, el resultado final es el CMC (nunca reporta menos que la capacidad acreditada)', () => {
    // Lecturas idénticas (repetibilidad ~0) y paralelismo perfecto ->
    // incertidumbre expandida muy chica, debe quedar acotada por el CMC.
    const resultado = calcularIncertidumbrePieDeMetroExterior({
      valorNominal: 150.0,
      lecturas: [150.00, 150.00, 150.00, 150.00],
      resolucion: 0.01,
      tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 100.00] },
    });

    expect(resultado.incertidumbre_expandida).toBeLessThan(resultado.cmc);
    expect(resultado.incertidumbre_final).toBe(resultado.cmc);
  });

  test('valor nominal sin patrón registrado -> error explícito (mismo criterio que MATCH exacto de la planilla real)', () => {
    expect(() => calcularIncertidumbrePieDeMetroExterior({
      valorNominal: 999,
      lecturas: [1, 1, 1, 1],
      resolucion: 0.01,
      tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100, 100, 100] },
    })).toThrow(/patrón/);
  });

  test('análogo usa resolución/√3 (no /(2√3) como digital)', () => {
    const digital = calcularIncertidumbrePieDeMetroExterior({
      valorNominal: 100, lecturas: [100, 100, 100, 100], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100, 100, 100] },
    });
    const analogo = calcularIncertidumbrePieDeMetroExterior({
      valorNominal: 100, lecturas: [100, 100, 100, 100], resolucion: 0.01, tipoInstrumento: 'analogo',
      paralelismo: { referencia: 100, puntaMedioFondo: [100, 100, 100] },
    });
    expect(analogo.componentes.resolucion).toBeCloseTo(digital.componentes.resolucion * 2, 10);
  });
});

// Tarea 4.2: las otras 3 secciones de Pie de Metros (Interiores,
// Profundímetro, Escalón), confirmadas celda por celda contra el .xlsx real
// antes de escribir el código — comparten la misma fórmula de 6
// componentes que Exteriores, y solo difieren en cómo se calcula la
// "lectura promedio" (ver comentario de calcularLecturaPromedio en el
// servicio).
describe('calcularIncertidumbrePieDeMetro — secciones Profundímetro y Escalón (4.2)', () => {
  test('Profundímetro con la misma entrada que el caso de Exteriores de 100mm da el mismo resultado numérico (misma fórmula real)', () => {
    const exterior = calcularIncertidumbrePieDeMetro({
      seccion: 'exterior', valorNominal: 100, lecturas: [100.00, 100.01, 100.01, 100.00], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
    });
    const profundidad = calcularIncertidumbrePieDeMetro({
      seccion: 'profundidad', valorNominal: 100, lecturas: [100.00, 100.01, 100.01, 100.00], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
    });
    const escalon = calcularIncertidumbrePieDeMetro({
      seccion: 'escalon', valorNominal: 100, lecturas: [100.00, 100.01, 100.01, 100.00], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
    });
    expect(profundidad.incertidumbre_expandida).toBeCloseTo(exterior.incertidumbre_expandida, 12);
    expect(escalon.incertidumbre_expandida).toBeCloseTo(exterior.incertidumbre_expandida, 12);
    expect(profundidad.seccion).toBe('profundidad');
    expect(escalon.seccion).toBe('escalon');
    // Referencia calculada a mano para B=100mm (patrón real Calculos!F63=0.0005mm):
    expect(profundidad.incertidumbre_expandida).toBeCloseTo(0.01492380648494832, 8);
  });
});

describe('calcularIncertidumbrePieDeMetro — sección Interiores (4.2)', () => {
  test('sin constante de tope: lectura promedio SIN redondear (a diferencia de Exteriores)', () => {
    const resultado = calcularIncertidumbrePieDeMetro({
      seccion: 'interior', valorNominal: 50, lecturas: [50.00, 50.02, 50.01, 50.01], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
      constanteDeTope: { tiene: false, valor: 0 },
    });
    // promedio real = 50.0075 -> este caso da exacto 50.01, no sirve para
    // distinguir de MROUND; el punto real de esta prueba es el patrón real
    // (Bloques Cortos, B=50mm -> Calculos!F61=0.00021mm) y el resultado
    // combinado, verificado a mano.
    expect(resultado.componentes.patron).toBeCloseTo(0.00021, 8);
    expect(resultado.incertidumbre_expandida).toBeCloseTo(0.01626672677585034, 8);
  });

  test('con constante de tope: se suma al promedio, sin redondear', () => {
    const resultado = calcularIncertidumbrePieDeMetro({
      seccion: 'interior', valorNominal: 50, lecturas: [50.00, 50.02, 50.01, 50.01], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
      constanteDeTope: { tiene: true, valor: 0.05 },
    });
    // promedio(50.00,50.02,50.01,50.01)=50.01 + 0.05 = 50.06, sin MROUND.
    expect(resultado.lectura_promedio).toBeCloseTo(50.06, 8);
    expect(resultado.error_indicacion).toBeCloseTo(0.06, 8);
  });

  test('un valor que SÍ redondearía distinto bajo MROUND confirma que Interiores nunca redondea', () => {
    // promedio = 50.004 -> MROUND a 0.01 daría 50.00; Interiores debe
    // devolver 50.004 tal cual (sin redondear).
    const resultado = calcularIncertidumbrePieDeMetro({
      seccion: 'interior', valorNominal: 50, lecturas: [50.00, 50.008, 50.004, 50.004], resolucion: 0.01, tipoInstrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
      constanteDeTope: { tiene: false, valor: 0 },
    });
    expect(resultado.lectura_promedio).toBeCloseTo(50.004, 8);
  });
});
