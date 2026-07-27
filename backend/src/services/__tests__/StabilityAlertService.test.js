const { nivelVencimiento, diasEntre } = require('../StabilityAlertService');

// Tarea 3.5: prueba solo las funciones puras de clasificación de umbrales
// (sin BD) — la reconciliación con la tabla stability_alerts (dedup,
// resolución) se verificó manualmente end-to-end contra la BD de desarrollo
// (ver PLAN_DESARROLLO.md, tarea 3.5), mismo bloqueo de `npm test` por el
// permiso CREATEDB pendiente desde la tarea 0.1.
describe('diasEntre', () => {
  test('fecha futura da un número positivo de días', () => {
    expect(diasEntre('2026-08-25', '2026-07-26')).toBe(30);
  });

  test('fecha pasada da un número negativo de días', () => {
    expect(diasEntre('2026-07-01', '2026-07-26')).toBe(-25);
  });
});

describe('nivelVencimiento', () => {
  test('vencido (días negativos) devuelve "vencido"', () => {
    expect(nivelVencimiento(-1)).toBe('vencido');
    expect(nivelVencimiento(-100)).toBe('vencido');
  });

  test('dentro de 30 días devuelve el umbral más ajustado (30)', () => {
    expect(nivelVencimiento(0)).toBe('30');
    expect(nivelVencimiento(30)).toBe('30');
  });

  test('entre 31 y 60 días devuelve el umbral 60', () => {
    expect(nivelVencimiento(31)).toBe('60');
    expect(nivelVencimiento(60)).toBe('60');
  });

  test('entre 61 y 90 días devuelve el umbral 90', () => {
    expect(nivelVencimiento(61)).toBe('90');
    expect(nivelVencimiento(90)).toBe('90');
  });

  test('más de 90 días no genera alerta (null)', () => {
    expect(nivelVencimiento(91)).toBeNull();
    expect(nivelVencimiento(365)).toBeNull();
  });
});
