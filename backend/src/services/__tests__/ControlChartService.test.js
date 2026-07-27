const { calcularLimites } = require('../ControlChartService');

// Tarea 4.4 (D7, segunda vista de estabilidad): prueba solo la función pura
// de cálculo de límites (sin BD), método de rango móvil n=2 estándar de
// cartas de control de valores individuales (Shewhart X-chart).
describe('calcularLimites', () => {
  test('serie con variación conocida: límites coinciden con el cálculo de referencia a mano', () => {
    // media=10; MR: 2,4,3,2 -> MR̄=2.75; sigma=2.75/1.128=2.4379...
    // UCL=10+3*sigma=17.3138..., LCL=10-3*sigma=2.6862...
    const { media, sigma, limite_superior, limite_inferior } = calcularLimites([10, 12, 8, 11, 9]);
    expect(media).toBe(10);
    expect(sigma).toBeCloseTo(2.437943, 5);
    expect(limite_superior).toBeCloseTo(17.31383, 4);
    expect(limite_inferior).toBeCloseTo(2.68617, 4);
  });

  test('serie constante: sigma 0 y límites iguales a la media (sin división por cero)', () => {
    const { media, sigma, limite_superior, limite_inferior } = calcularLimites([10, 10, 10, 10]);
    expect(media).toBe(10);
    expect(sigma).toBe(0);
    expect(limite_superior).toBe(10);
    expect(limite_inferior).toBe(10);
  });
});
