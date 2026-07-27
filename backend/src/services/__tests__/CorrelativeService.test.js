const { sequelize } = require('../../models');
const CorrelativeService = require('../CorrelativeService');

let backup;

beforeEach(async () => {
  // El esquema ya existe (creado por jest.setup.js corriendo las
  // migraciones reales); cada test parte de la tabla vacía para que los
  // números generados sean predecibles (1..N). Pero esta suite corre contra
  // la misma BD Postgres real que usan las suites E2E (etapa1/2/3, 4.1) —
  // que si no se restaura, un TRUNCATE liso deja el contador en 0 mientras
  // esas suites (que corrieron antes en la misma BD persistente, ya sea en
  // esta corrida o en una anterior de npm test) ya tienen work_orders/
  // certificados/cotizaciones reales numerados más arriba, causando
  // "llave duplicada" en la próxima creación real. Se respalda la tabla y se
  // restaura en afterEach en vez de truncar sin más. No se envuelve en una
  // transacción de la propia suite porque el test de "20 llamadas
  // paralelas" necesita conexiones/transacciones realmente concurrentes
  // para validar el UPSERT atómico — una única transacción compartida las
  // serializaría y dejaría de probar nada.
  backup = await sequelize.models.Correlative.findAll({ raw: true });
  await sequelize.models.Correlative.destroy({ where: {}, truncate: true });
});

afterEach(async () => {
  await sequelize.models.Correlative.destroy({ where: {}, truncate: true });
  if (backup.length) {
    await sequelize.models.Correlative.bulkCreate(backup);
  }
});

afterAll(async () => {
  await sequelize.close();
});

test('20 llamadas paralelas generan 20 códigos únicos y consecutivos', async () => {
  const resultados = await Promise.all(
    Array.from({ length: 20 }, () => CorrelativeService.next('orden_trabajo'))
  );

  const unicos = new Set(resultados);
  expect(unicos.size).toBe(20);

  const anio = new Date().getFullYear();
  const numeros = resultados
    .map((codigo) => Number(codigo.split('-')[2]))
    .sort((a, b) => a - b);

  expect(numeros).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  resultados.forEach((codigo) => expect(codigo).toMatch(new RegExp(`^OT-${anio}-\\d{3}$`)));
});

test('tipos distintos llevan contadores independientes', async () => {
  const [ot, cert, cot] = await Promise.all([
    CorrelativeService.next('orden_trabajo'),
    CorrelativeService.next('certificado'),
    CorrelativeService.next('cotizacion'),
  ]);

  expect(ot).toMatch(/^OT-/);
  expect(cert).toMatch(/^CERT-/);
  expect(cot).toMatch(/^COT-/);
});
