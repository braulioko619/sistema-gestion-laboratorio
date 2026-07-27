// Test E2E de la tarea 4.1 (motor de incertidumbre GUM, piloto Pie de
// Metros). Mismo patrón de bootstrap que etapa3-captura-y-base-metrologica.test.js
// (Role.findOrCreate, evita el seeder roto — ver docs/PLAN_DESARROLLO.md,
// hallazgo #11).
const request = require('supertest');
const app = require('../app');
const { sequelize, Role, User, CalibrationFormTemplate, CalibrationFormTemplateVersion } = require('../models');
const { hashPassword } = require('../utils/auth');

let tokenAdmin;
let adminId;

async function loginComoRol(nombreRol, nombreUsuario) {
  const [rol] = await Role.findOrCreate({
    where: { nombre: nombreRol },
    defaults: { nombre: nombreRol, permisos: [] },
  });
  const email = `${nombreRol}.e2e41.${Date.now()}.${Math.random().toString(36).slice(2)}@laboratorio.com`;
  const user = await User.create({
    email, password: await hashPassword('E2ETest@123'), nombre: nombreUsuario,
    role_id: rol.id, estado: 'activo',
  });
  const login = await request(app).post('/api/auth/login').send({ email, password: 'E2ETest@123' });
  if (!login.body?.data?.token) {
    throw new Error(`Login falló para ${email}: ${JSON.stringify(login.body)}`);
  }
  return { token: login.body.data.token, userId: user.id };
}

beforeAll(async () => {
  const admin = await loginComoRol('administrador', 'Admin E2E 4.1');
  tokenAdmin = admin.token;
  adminId = admin.userId;
});

afterAll(async () => {
  await sequelize.close();
});

function auth(req) {
  return req.set('Authorization', `Bearer ${tokenAdmin}`);
}

// Schema idéntico al creado en la BD de desarrollo por esta sesión — el
// test crea su propia plantilla (no depende de que exista de antemano en
// la BD contra la que corra), mismo criterio que el resto de tests E2E de
// este proyecto (nunca dependen de datos sembrados fuera del propio test).
const SCHEMA_PIE_METRO_EXTERIOR = {
  type: 'object',
  required: ['valor_nominal', 'lecturas', 'resolucion', 'tipo_instrumento', 'paralelismo'],
  properties: {
    valor_nominal: { type: 'number', unidad: 'mm' },
    lecturas: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number', unidad: 'mm' } },
    resolucion: { type: 'number', unidad: 'mm', enum: [0.1, 0.05, 0.02, 0.01] },
    tipo_instrumento: { type: 'string', enum: ['analogo', 'digital'] },
    paralelismo: {
      type: 'object',
      required: ['referencia', 'puntaMedioFondo'],
      properties: {
        referencia: { type: 'number', unidad: 'mm' },
        puntaMedioFondo: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number', unidad: 'mm' } },
      },
    },
  },
};

test('4.1: capturar -> confirmar -> calcular incertidumbre GUM, punto de 150mm', async () => {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const plantilla = await CalibrationFormTemplate.create({
    codigo: `FRM-E2E41-${sufijo}`, nombre: 'Pie de Metro E2E 4.1', magnitud: 'Longitud', creado_por: adminId,
  });
  const version = await CalibrationFormTemplateVersion.create({
    template_id: plantilla.id, version: '1.0', schema: SCHEMA_PIE_METRO_EXTERIOR, vigente: true, creado_por: adminId,
  });

  const cliente = await auth(request(app).post('/api/clients')).send({
    nombre: `Cliente E2E 4.1 ${sufijo}`, identificacion_fiscal: `E2E41-${sufijo}`, email_contacto: `e2e41.${sufijo}@test.com`,
  });
  const instrumento = await auth(request(app).post(`/api/clients/${cliente.body.data.id}/instruments`)).send({
    codigo_interno: `PIE-METRO-E2E41-${sufijo}`, tipo_instrumento: 'Pie de metro',
  });
  const ot = await auth(request(app).post('/api/work-orders')).send({
    cliente_id: cliente.body.data.id, fecha_ingreso: new Date().toISOString().split('T')[0],
    responsable_id: adminId, items: [{ instrumento_cliente_id: instrumento.body.data.id, acreditado: false }],
  });
  const itemId = ot.body.data.items[0].id;

  const sinCapturas = await auth(request(app).post(`/api/work-orders/items/${itemId}/calculate-uncertainty`));
  expect(sinCapturas.status).toBe(400);
  expect(sinCapturas.body.error.code).toBe('NO_CONFIRMED_FORM_ENTRY');

  const entry = await auth(request(app).post(`/api/work-orders/items/${itemId}/form-entries`)).send({
    form_template_version_id: version.id,
    data: {
      valor_nominal: 150.0,
      lecturas: [150.00, 150.01, 150.01, 150.00],
      resolucion: 0.01,
      tipo_instrumento: 'digital',
      paralelismo: { referencia: 100, puntaMedioFondo: [100.00, 100.00, 99.99] },
    },
  });
  expect(entry.status).toBe(201);

  await auth(request(app).post(`/api/work-orders/form-entries/${entry.body.data.id}/confirm`));

  const calculo = await auth(request(app).post(`/api/work-orders/items/${itemId}/calculate-uncertainty`));
  expect(calculo.status).toBe(200);
  expect(calculo.body.data.puntos).toHaveLength(1);
  // Mismo caso de referencia calculado a mano (fuera del PDF de validación
  // desactualizado, ver UncertaintyEngineService.test.js).
  expect(calculo.body.data.incertidumbre_U).toBeCloseTo(0.015261362676927502, 9);
  expect(calculo.body.data.factor_k).toBe(2);

  const otReleida = await auth(request(app).get(`/api/work-orders/${ot.body.data.id}`));
  const itemReleido = otReleida.body.data.items.find((i) => i.id === itemId);
  expect(Number(itemReleido.incertidumbre_U)).toBeCloseTo(0.015261362676927502, 6);
  expect(Number(itemReleido.factor_k)).toBe(2);
  expect(itemReleido.puntos).toHaveLength(1);
}, 30000);
