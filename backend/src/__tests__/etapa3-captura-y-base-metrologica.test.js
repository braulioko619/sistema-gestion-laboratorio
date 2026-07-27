// Test E2E de cierre de Etapa 3 (tarea 3.6): plantillas de formulario JSONB
// (3.1), captura en terreno con validación parcial/completa (3.2), historial
// de patrones manual + importador CSV (3.3), análisis de deriva con
// validación numérica contra una referencia calculada a mano (3.4) y
// alertas de estabilidad con deduplicación (3.5).
//
// Mismo patrón que etapa2-guardian-excel-emision.test.js: Role.findOrCreate
// para no depender del seeder roto (ver docs/PLAN_DESARROLLO.md, hallazgo
// #11), usuarios de prueba desechables por corrida.
const request = require('supertest');
const app = require('../app');
const { sequelize, Role, User } = require('../models');
const { hashPassword } = require('../utils/auth');

let tokenAdmin;
let adminId;

async function loginComoRol(nombreRol, nombreUsuario) {
  const [rol] = await Role.findOrCreate({
    where: { nombre: nombreRol },
    defaults: { nombre: nombreRol, permisos: [] },
  });
  const email = `${nombreRol}.e2e36.${Date.now()}.${Math.random().toString(36).slice(2)}@laboratorio.com`;
  const user = await User.create({
    email,
    password: await hashPassword('E2ETest@123'),
    nombre: nombreUsuario,
    role_id: rol.id,
    estado: 'activo',
  });
  const login = await request(app).post('/api/auth/login').send({ email, password: 'E2ETest@123' });
  if (!login.body?.data?.token) {
    throw new Error(`Login falló para ${email}: ${JSON.stringify(login.body)}`);
  }
  return { token: login.body.data.token, userId: user.id };
}

beforeAll(async () => {
  const admin = await loginComoRol('administrador', 'Admin E2E 3.6');
  tokenAdmin = admin.token;
  adminId = admin.userId;
});

afterAll(async () => {
  await sequelize.close();
});

function auth(req, token) {
  return req.set('Authorization', `Bearer ${token || tokenAdmin}`);
}

async function crearItemDeOt(sufijo) {
  const cliente = await auth(request(app).post('/api/clients')).send({
    nombre: `Cliente E2E 3.6 ${sufijo}`,
    identificacion_fiscal: `E2E36-${sufijo}`,
    email_contacto: `e2e36.${sufijo}@test.com`,
  });
  expect(cliente.status).toBe(201);

  const instrumento = await auth(request(app).post(`/api/clients/${cliente.body.data.id}/instruments`)).send({
    codigo_interno: `INST-E2E36-${sufijo}`,
    tipo_instrumento: 'Manómetro',
  });
  expect(instrumento.status).toBe(201);

  const ot = await auth(request(app).post('/api/work-orders')).send({
    cliente_id: cliente.body.data.id,
    fecha_ingreso: new Date().toISOString().split('T')[0],
    responsable_id: adminId,
    items: [{ instrumento_cliente_id: instrumento.body.data.id, acreditado: false }],
  });
  expect(ot.status).toBe(201);
  return ot.body.data.items[0];
}

test('3.1: plantillas de formulario JSONB — schema inválido rechazado, versión vigente única', async () => {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const crear = await auth(request(app).post('/api/calibration-form-templates')).send({
    codigo: `FRM-E2E36-${sufijo}`,
    nombre: 'Plantilla captura E2E',
    magnitud: `Masa-E2E-${sufijo}`,
  });
  expect(crear.status).toBe(201);
  const templateId = crear.body.data.id;

  const schemaInvalido = await auth(request(app).post(`/api/calibration-form-templates/${templateId}/versions`)).send({
    version: '1.0',
    schema: { type: 'string' },
  });
  expect(schemaInvalido.status).toBe(400);
  expect(schemaInvalido.body.error.code).toBe('INVALID_SCHEMA');

  const schemaValido = {
    type: 'object',
    required: ['valor_leido'],
    properties: {
      valor_leido: { type: 'number', unidad: 'kg', minimum: 0, maximum: 50 },
      observaciones: { type: 'string' },
    },
  };
  const v1 = await auth(request(app).post(`/api/calibration-form-templates/${templateId}/versions`)).send({
    version: '1.0',
    schema: schemaValido,
  });
  expect(v1.status).toBe(201);
  const versionId = v1.body.data.id;

  const marcarVigente = await auth(request(app).patch(`/api/calibration-form-templates/${templateId}/versions/${versionId}/vigente`));
  expect(marcarVigente.status).toBe(200);

  const v2 = await auth(request(app).post(`/api/calibration-form-templates/${templateId}/versions`)).send({
    version: '2.0',
    schema: schemaValido,
  });
  expect(v2.status).toBe(201);
  const marcarV2Vigente = await auth(request(app).patch(`/api/calibration-form-templates/${templateId}/versions/${v2.body.data.id}/vigente`));
  expect(marcarV2Vigente.status).toBe(200);

  const detalle = await auth(request(app).get(`/api/calibration-form-templates/${templateId}`));
  const vigentes = detalle.body.data.versiones.filter((v) => v.vigente);
  expect(vigentes).toHaveLength(1);
  expect(vigentes[0].version).toBe('2.0');

  return { templateId, versionId: v2.body.data.id, schemaValido };
});

test('3.2: captura en terreno — parcial acepta incompleto pero no fuera de rango, confirmar exige completo, luego inmutable', async () => {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const item = await crearItemDeOt(sufijo);

  const plantilla = await auth(request(app).post('/api/calibration-form-templates')).send({
    codigo: `FRM-E2E36B-${sufijo}`,
    nombre: 'Plantilla captura E2E B',
    magnitud: `Masa-E2E-${sufijo}`,
  });
  const schema = {
    type: 'object',
    required: ['valor_leido', 'temperatura'],
    properties: {
      valor_leido: { type: 'number', unidad: 'kg' },
      temperatura: { type: 'number', unidad: '°C', maximum: 50 },
    },
  };
  const version = await auth(request(app).post(`/api/calibration-form-templates/${plantilla.body.data.id}/versions`)).send({ version: '1.0', schema });
  const versionId = version.body.data.id;

  // Parcial: falta 'valor_leido' (permitido en borrador), pero
  // 'temperatura' fuera de rango se rechaza igual desde el primer guardado.
  const fueraDeRango = await auth(request(app).post(`/api/work-orders/items/${item.id}/form-entries`)).send({
    form_template_version_id: versionId,
    data: { temperatura: 999 },
  });
  expect(fueraDeRango.status).toBe(400);
  expect(fueraDeRango.body.error.code).toBe('DATA_OUT_OF_SCHEMA');

  const parcial = await auth(request(app).post(`/api/work-orders/items/${item.id}/form-entries`)).send({
    form_template_version_id: versionId,
    data: { temperatura: 21 },
  });
  expect(parcial.status).toBe(201);
  expect(parcial.body.data.estado).toBe('borrador');
  const entryId = parcial.body.data.id;

  const confirmarIncompleto = await auth(request(app).post(`/api/work-orders/form-entries/${entryId}/confirm`));
  expect(confirmarIncompleto.status).toBe(400);
  expect(confirmarIncompleto.body.error.code).toBe('DATA_INCOMPLETE');

  const completar = await auth(request(app).put(`/api/work-orders/form-entries/${entryId}`)).send({
    data: { temperatura: 21, valor_leido: 10.5 },
  });
  expect(completar.status).toBe(200);

  const confirmar = await auth(request(app).post(`/api/work-orders/form-entries/${entryId}/confirm`));
  expect(confirmar.status).toBe(200);
  expect(confirmar.body.data.estado).toBe('confirmado');

  const editarConfirmada = await auth(request(app).put(`/api/work-orders/form-entries/${entryId}`)).send({ data: { temperatura: 22, valor_leido: 11 } });
  expect(editarConfirmada.status).toBe(403);
  expect(editarConfirmada.body.error.code).toBe('ENTRY_IMMUTABLE');
});

test('3.3/3.4: historial de patrones (manual + CSV) y análisis de deriva contra una referencia calculada a mano', async () => {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const equipo = await auth(request(app).post('/api/equipment')).send({
    codigo: `PAT-E2E36-${sufijo}`,
    nombre: 'Patrón E2E 3.6',
    magnitud: `Masa-E2E-${sufijo}`,
    error_maximo_permitido: 0.01,
  });
  expect(equipo.status).toBe(201);
  const equipmentId = equipo.body.data.id;

  // Registro manual: 2 puntos, mismo punto_medicion, con certificado PDF.
  const registrar = await auth(request(app).post(`/api/equipment/${equipmentId}/calibration-history`))
    .field('fecha_calibracion', '2025-01-01')
    .field('tipo', 'externa')
    .field('laboratorio', 'Lab E2E')
    .field('proxima_calibracion', '2026-01-01')
    .field('puntos', JSON.stringify([
      { punto_medicion: '10kg', valor_nominal: 10, valor_certificado: 10.00, unidad: 'kg', incertidumbre_U: 0.001, factor_k: 2 },
    ]))
    .attach('archivo', Buffer.from(`cert-e2e36-${sufijo}`), 'certificado.pdf');
  expect(registrar.status).toBe(201);
  expect(registrar.body.data[0].certificado_sha256).toHaveLength(64);

  // proxima_calibracion se aplicó (es la única fecha conocida hasta ahora).
  const equipoTrasRegistro = await auth(request(app).get(`/api/equipment/${equipmentId}`));
  expect(equipoTrasRegistro.body.data.proxima_calibracion).toBe('2026-01-01');

  // Importador CSV: 3 puntos más del mismo punto_medicion, con una recta
  // exacta conocida y = 10 + 0.002x (x en días desde 2025-01-01), para poder
  // comparar la pendiente que calcule el motor de deriva contra el valor
  // esperado calculado a mano (protocolo de validación numérica, tarea 3.6).
  // Filas (x=días desde 2025-01-01, y=valor_certificado):
  //   2025-04-01 (x=90):  y = 10 + 0.002*90  = 10.18
  //   2025-07-01 (x=181): y = 10 + 0.002*181 = 10.362
  //   2025-10-01 (x=273): y = 10 + 0.002*273 = 10.546
  const csv = [
    'fecha_calibracion,tipo,laboratorio,certificado_numero,punto_medicion,valor_nominal,valor_certificado,unidad,incertidumbre_U,factor_k',
    '2025-04-01,externa,Lab E2E,CERT-E2E36-2,10kg,10,10.18,kg,0.0012,2',
    '2025-07-01,externa,Lab E2E,CERT-E2E36-3,10kg,10,10.362,kg,0.0013,2',
    '2025-10-01,externa,Lab E2E,CERT-E2E36-4,10kg,10,10.546,kg,0.0014,2',
  ].join('\n');

  const importar = await auth(request(app).post(`/api/equipment/${equipmentId}/calibration-history/import-csv`))
    .attach('archivo', Buffer.from(csv), 'historial.csv');
  expect(importar.status).toBe(201);
  expect(importar.body.data.importados).toBe(3);

  // El importador CSV no toca proxima_calibracion (carga retroactiva).
  const equipoTrasImportar = await auth(request(app).get(`/api/equipment/${equipmentId}`));
  expect(equipoTrasImportar.body.data.proxima_calibracion).toBe('2026-01-01');

  const historial = await auth(request(app).get(`/api/equipment/${equipmentId}/calibration-history?punto_medicion=10kg`));
  expect(historial.body.data).toHaveLength(4);

  const deriva = await auth(request(app).get(`/api/equipment/${equipmentId}/drift-analysis`));
  expect(deriva.status).toBe(200);
  const analisis = deriva.body.data.find((a) => a.punto_medicion === '10kg');
  expect(analisis.suficientes_datos).toBe(true);
  // Referencia calculada a mano por mínimos cuadrados sobre los 4 puntos
  // (x en días desde 2025-01-01: 0, 90, 181, 273; y: 10, 10.18, 10.362, 10.546),
  // construidos deliberadamente sobre la recta exacta y = 10 + 0.002x:
  // xMean=136, yMean=10.272; pendiente = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)² = 0.002 exacto.
  expect(analisis.pendiente).toBeCloseTo(0.002, 6);
  // La desviación proyectada al año siguiente supera error_maximo_permitido=0.01
  expect(analisis.alerta_error_maximo.supera).toBe(true);

  return { equipmentId };
});

test('3.5: alertas de estabilidad — se generan, no se duplican en corridas repetidas, y se resuelven', async () => {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Patrón con calibración vencida: dispara vencimiento_calibracion.
  const equipo = await auth(request(app).post('/api/equipment')).send({
    codigo: `PAT-E2E36B-${sufijo}`,
    nombre: 'Patrón E2E 3.6 alertas',
    magnitud: `Masa-E2E-${sufijo}`,
  });
  const equipmentId = equipo.body.data.id;
  await auth(request(app).post(`/api/equipment/${equipmentId}/events`)).send({
    tipo: 'calibracion',
    fecha_realizacion: '2020-01-01',
    proxima_fecha: '2020-06-01',
    resultado: 'conforme',
  });

  const primeraCorrida = await auth(request(app).post('/api/equipment/stability-alerts/run'));
  expect(primeraCorrida.status).toBe(200);
  expect(primeraCorrida.body.data.nuevas).toBeGreaterThanOrEqual(1);

  const activasTrasPrimera = await auth(request(app).get('/api/equipment/stability-alerts'));
  const alertaDeEsteEquipo = activasTrasPrimera.body.data.find(
    (a) => a.equipment_id === equipmentId && a.tipo === 'vencimiento_calibracion'
  );
  expect(alertaDeEsteEquipo).toBeDefined();
  expect(alertaDeEsteEquipo.nivel).toBe('vencido');
  const idAlertaOriginal = alertaDeEsteEquipo.id;

  // Segunda corrida sin cambios: no debe crear una fila nueva para la misma
  // condición (dedup vía índice único parcial + reconciliación).
  const segundaCorrida = await auth(request(app).post('/api/equipment/stability-alerts/run'));
  expect(segundaCorrida.status).toBe(200);
  const activasTrasSegunda = await auth(request(app).get('/api/equipment/stability-alerts'));
  const alertasDeEsteEquipoTrasSegunda = activasTrasSegunda.body.data.filter(
    (a) => a.equipment_id === equipmentId && a.tipo === 'vencimiento_calibracion'
  );
  expect(alertasDeEsteEquipoTrasSegunda).toHaveLength(1);
  expect(alertasDeEsteEquipoTrasSegunda[0].id).toBe(idAlertaOriginal);

  // Resolver la condición (calibrar de nuevo, a futuro) y confirmar que la
  // alerta desaparece de las activas.
  await auth(request(app).post(`/api/equipment/${equipmentId}/events`)).send({
    tipo: 'calibracion',
    fecha_realizacion: new Date().toISOString().split('T')[0],
    proxima_fecha: '2099-01-01',
    resultado: 'conforme',
  });
  const terceraCorrida = await auth(request(app).post('/api/equipment/stability-alerts/run'));
  expect(terceraCorrida.status).toBe(200);
  expect(terceraCorrida.body.data.resueltas).toBeGreaterThanOrEqual(1);

  const activasTrasResolucion = await auth(request(app).get('/api/equipment/stability-alerts'));
  const siguePendiente = activasTrasResolucion.body.data.some(
    (a) => a.equipment_id === equipmentId && a.tipo === 'vencimiento_calibracion'
  );
  expect(siguePendiente).toBe(false);
});
