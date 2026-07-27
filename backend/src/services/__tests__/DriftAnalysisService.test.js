const { regresionLineal } = require('../DriftAnalysisService');

// Tarea 3.4, criterio de aceptación: "con datos sintéticos conocidos, la
// pendiente calculada coincide". Prueba solo la función pura (sin BD), que
// es exactamente lo que analizarPunto delega para el cálculo de tendencia.
describe('regresionLineal', () => {
  test('recta exacta y = 5 + 2x: pendiente e intercepto coinciden exactamente', () => {
    const puntos = [0, 1, 2, 3, 4].map((x) => ({ x, y: 5 + 2 * x }));
    const { pendiente, intercepto } = regresionLineal(puntos);
    expect(pendiente).toBeCloseTo(2, 9);
    expect(intercepto).toBeCloseTo(5, 9);
  });

  test('serie con ruido real: pendiente coincide con el valor calculado por mínimos cuadrados a mano', () => {
    // x en días desde la primera calibración, y = valor_certificado.
    const puntos = [
      { x: 0, y: 100.0 },
      { x: 10, y: 100.05 },
      { x: 20, y: 100.11 },
      { x: 30, y: 100.14 },
    ];
    const { pendiente, intercepto } = regresionLineal(puntos);
    // Calculado a mano: xMean=15, yMean=100.075
    // numerador = -15*-0.075 + -5*-0.025 + 5*0.035 + 15*0.065 = 1.125+0.125+0.175+0.975=2.4
    // denominador = 225+25+25+225 = 500 -> pendiente = 2.4/500 = 0.0048
    expect(pendiente).toBeCloseTo(0.0048, 6);
    expect(intercepto).toBeCloseTo(100.003, 6);
  });

  test('x constante (sin varianza temporal): pendiente 0, no explota por división por cero', () => {
    const puntos = [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }];
    const { pendiente } = regresionLineal(puntos);
    expect(pendiente).toBe(0);
  });
});
