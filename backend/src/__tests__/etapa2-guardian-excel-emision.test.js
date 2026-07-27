// Test E2E de cierre de Etapa 2 (tarea 2.10): guardián de Excels (2.1/2.2),
// raw data con hash (2.3), captura de U/k (2.4), matriz de competencias
// (2.5), generación de PDF (2.6), motor de reglas de emisión (2.7), firma
// (2.8) e inmutabilidad/enmienda (2.9) — recorridos de punta a punta para un
// certificado ACREDITADO y uno NO ACREDITADO.
//
// No depende de seeders (evita el seeder roto de
// 20260616000001-seed-roles-and-admin.js, ver docs/PLAN_DESARROLLO.md):
// usa Role.findOrCreate para reusar los roles reales si ya existen (BD de
// desarrollo, donde 'administrador' y 'signatario_inn' ya están sembrados)
// o crearlos si no (BD de test limpia, donde jest.setup.js solo corre
// migraciones). Cada usuario de prueba es nuevo y desechable; los roles se
// comparten, nunca se renombran (a diferencia de un intento anterior en
// etapa1-cotizacion-a-facturacion.test.js que renombraba un rol DESPUÉS de
// loguearse con él — el JWT ya llevaba el nombre viejo horneado y además
// el rename chocaba con el 'administrador' real de la BD de desarrollo;
// corregido ahí también como parte de esta tarea).
const request = require('supertest');
const app = require('../app');
const { sequelize, Role, User, AccreditationScope } = require('../models');
const { hashPassword } = require('../utils/auth');

let tokenAdmin;
let tokenSignatario;
let adminId;

async function loginComoRol(nombreRol, nombreUsuario) {
  const [rol] = await Role.findOrCreate({
    where: { nombre: nombreRol },
    defaults: { nombre: nombreRol, permisos: [] },
  });
  const email = `${nombreRol}.e2e210.${Date.now()}.${Math.random().toString(36).slice(2)}@laboratorio.com`;
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
  const admin = await loginComoRol('administrador', 'Admin E2E 2.10');
  tokenAdmin = admin.token;
  adminId = admin.userId;

  const signatario = await loginComoRol('signatario_inn', 'Signatario E2E 2.10');
  tokenSignatario = signatario.token;
});

afterAll(async () => {
  await sequelize.close();
});

function auth(req, token) {
  return req.set('Authorization', `Bearer ${token || tokenAdmin}`);
}

test('2.1/2.2: gestor de plantillas Excel y descarga controlada de la versión vigente', async () => {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const crear = await auth(request(app).post('/api/excel-templates')).send({
    codigo: `PLT-E2E-${sufijo}`,
    nombre: 'Plantilla E2E',
    magnitud: 'Presión',
  });
  expect(crear.status).toBe(201);
  const templateId = crear.body.data.id;

  const sinVersion = await auth(request(app).get(`/api/excel-templates/${templateId}/download`));
  expect(sinVersion.status).toBe(404);

  const subir = await auth(request(app).post(`/api/excel-templates/${templateId}/versions`))
    .field('version', '1.0')
    .attach('archivo', Buffer.from('contenido-v1'), 'plantilla.xlsx');
  expect(subir.status).toBe(201);
  const versionId = subir.body.data.id;
  expect(subir.body.data.sha256).toHaveLength(64);

  const aunNoVigente = await auth(request(app).get(`/api/excel-templates/${templateId}/download`));
  expect(aunNoVigente.status).toBe(404);

  const marcarVigente = await auth(request(app).patch(`/api/excel-templates/${templateId}/versions/${versionId}/vigente`));
  expect(marcarVigente.status).toBe(200);

  const descarga = await auth(request(app).get(`/api/excel-templates/${templateId}/download`));
  expect(descarga.status).toBe(200);
  // superagent no bufferiza este content-type (xlsx) como binario en
  // `.body`; el contenido queda en `.text` (confirmado corriendo esta misma
  // request contra la BD de desarrollo).
  expect(descarga.text).toBe('contenido-v1');
});

test('flujo completo NO ACREDITADO: generar -> firmar -> emitir -> enmendar', async () => {
  const resultado = await recorrerFlujoCertificado({ acreditado: false });
  expect(resultado.certificadoFinal.estado).toBe('emitido');
  expect(resultado.certificadoFinal.acreditado).toBe(false);
  expect(resultado.firmaInicial.rol_firma).toBe('tecnico');
}, 30000);

test('flujo completo ACREDITADO: exige signatario_inn, alcance INN y motor de reglas 2.7', async () => {
  const resultado = await recorrerFlujoCertificado({ acreditado: true });
  expect(resultado.certificadoFinal.estado).toBe('emitido');
  expect(resultado.certificadoFinal.acreditado).toBe(true);
  expect(resultado.firmaInicial.rol_firma).toBe('signatario_inn');
}, 30000);

// Recorre el ciclo completo de un certificado (2.3 a 2.9) para un ítem
// acreditado o no acreditado, devolviendo los datos intermedios relevantes
// para que cada test de arriba haga sus propias aserciones.
async function recorrerFlujoCertificado({ acreditado }) {
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2)}-${acreditado ? 'ACR' : 'NOACR'}`;
  const magnitud = `Presión-E2E-${sufijo}`;

  const cliente = await auth(request(app).post('/api/clients')).send({
    nombre: `Cliente E2E 2.10 ${sufijo}`,
    identificacion_fiscal: `E2E210-${sufijo}`,
    email_contacto: `e2e210.${sufijo}@test.com`,
  });
  expect(cliente.status).toBe(201);

  const instrumento = await auth(request(app).post(`/api/clients/${cliente.body.data.id}/instruments`)).send({
    codigo_interno: `INST-E2E210-${sufijo}`,
    tipo_instrumento: 'Manómetro',
  });
  expect(instrumento.status).toBe(201);

  const ot = await auth(request(app).post('/api/work-orders')).send({
    cliente_id: cliente.body.data.id,
    fecha_ingreso: new Date().toISOString().split('T')[0],
    responsable_id: adminId,
    items: [{ instrumento_cliente_id: instrumento.body.data.id, acreditado }],
  });
  expect(ot.status).toBe(201);
  const item = ot.body.data.items[0];
  expect(item.acreditado).toBe(acreditado);

  const equipo = await auth(request(app).post('/api/equipment')).send({
    codigo: `PAT-E2E210-${sufijo}`,
    nombre: 'Patrón E2E',
    magnitud,
  });
  expect(equipo.status).toBe(201);

  // Alcance INN (tarea 2.7, regla exclusiva de certificados acreditados): no
  // hay endpoint de creación (solo GET, ver AccreditationController), así
  // que se crea directo contra el modelo — mismo criterio que Role/User más
  // arriba, donde tampoco hay un flujo de API para ese bootstrap.
  if (acreditado) {
    await AccreditationScope.create({
      codigo_acreditacion: `OI-E2E-${sufijo}`,
      tipo_organismo: 'INN',
      norma_acreditacion: 'ISO/IEC 17025',
      area: magnitud,
      item: `Calibración de ${magnitud}`,
      activo: true,
    });
  }

  // El motor de reglas (2.7) exige, antes de poder emitir:
  // (a) el patrón vigente asociado al ítem (tarea 2.6)
  const patron = await auth(request(app).post(`/api/work-orders/items/${item.id}/patrones`)).send({ equipment_id: equipo.body.data.id });
  expect(patron.status).toBe(201);

  // (b) el técnico responsable de la OT autorizado para la magnitud del patrón (2.5)
  const autorizacion = await auth(request(app).post(`/api/personnel/${adminId}/authorizations`)).send({
    actividad: `Calibración de ${magnitud}`,
    magnitud,
    fecha_autorizacion: '2020-01-01',
    fecha_vencimiento: '2099-01-01',
  });
  expect(autorizacion.status).toBe(201);

  // (c) U y k capturados en el ítem (2.4)
  const uyk = await auth(request(app).put(`/api/work-orders/items/${item.id}`)).send({ incertidumbre_U: 0.05, factor_k: 2 });
  expect(uyk.status).toBe(200);

  // (d) al menos un raw data adjunto, con su hash verificado (2.3)
  const rawData = await auth(request(app).post(`/api/work-orders/items/${item.id}/data-files`))
    .attach('archivo', Buffer.from(`raw-data-${sufijo}`), 'raw.xlsx');
  expect(rawData.status).toBe(201);
  expect(rawData.body.data.sha256).toHaveLength(64);
  expect(rawData.body.data.hash_verificado).toBe(true);

  const verificarHash = await auth(request(app).post(`/api/work-orders/data-files/${rawData.body.data.id}/verify`));
  expect(verificarHash.status).toBe(200);
  expect(verificarHash.body.data.hash_verificado).toBe(true);

  // Generar certificado (2.6)
  const generar = await auth(request(app).post(`/api/work-orders/items/${item.id}/certificate/generate`)).send({
    decision_rule: 'Regla de decisión E2E',
    fecha_calibracion: '2026-07-20',
  });
  expect(generar.status).toBe(201);
  let certificado = generar.body.data;
  expect(certificado.estado).toBe('borrador');
  expect(certificado.acreditado).toBe(acreditado);
  expect(certificado.sha256_pdf).toHaveLength(64);

  // No se puede emitir sin firmar (2.8 cambió el contrato de updateCertificateEstado)
  const emitirSinFirmar = await auth(request(app).put(`/api/work-orders/certificates/${certificado.id}/estado`)).send({ estado: 'emitido' });
  expect(emitirSinFirmar.status).toBe(409);
  expect(emitirSinFirmar.body.error.code).toBe('NOT_SIGNED');

  // Firmar (2.8): acreditado exige signatario_inn; no acreditado lo firma el
  // propio responsable de la OT (admin, rol_firma 'tecnico').
  if (acreditado) {
    const firmaRechazada = await auth(request(app).post(`/api/work-orders/certificates/${certificado.id}/sign`));
    expect(firmaRechazada.status).toBe(403);
    expect(firmaRechazada.body.error.code).toBe('SIGNATORY_ROLE_REQUIRED');
  }
  const firmarToken = acreditado ? tokenSignatario : tokenAdmin;
  const firmar = await auth(request(app).post(`/api/work-orders/certificates/${certificado.id}/sign`), firmarToken);
  expect(firmar.status).toBe(201);
  expect(firmar.body.data.certificado.estado).toBe('firmado');
  const firmaInicial = firmar.body.data.firma;
  expect(firmaInicial.rol_firma).toBe(acreditado ? 'signatario_inn' : 'tecnico');

  // Checklist en verde (2.7) y emisión
  const checklist = await auth(request(app).get(`/api/work-orders/certificates/${certificado.id}/issuance-check`));
  expect(checklist.status).toBe(200);
  expect(checklist.body.data.permitida).toBe(true);

  const emitir = await auth(request(app).put(`/api/work-orders/certificates/${certificado.id}/estado`)).send({ estado: 'emitido' });
  expect(emitir.status).toBe(200);
  certificado = emitir.body.data;
  expect(certificado.estado).toBe('emitido');

  // Inmutabilidad (2.9): ni una fecha se puede tocar una vez emitido, ni
  // "volver" a borrador
  const editarInmutable = await auth(request(app).put(`/api/work-orders/certificates/${certificado.id}/estado`)).send({
    estado: 'borrador',
    fecha_calibracion: '2000-01-01',
  });
  expect(editarInmutable.status).toBe(403);
  expect(editarInmutable.body.error.code).toBe('CERTIFICATE_IMMUTABLE');

  // Enmienda (2.9): motivo obligatorio, marca al original superseded y crea
  // uno nuevo que recorre otra vez firmar -> emitir.
  const enmiendaSinMotivo = await auth(request(app).post(`/api/work-orders/certificates/${certificado.id}/amend`)).send({});
  expect(enmiendaSinMotivo.status).toBe(400);

  const enmienda = await auth(request(app).post(`/api/work-orders/certificates/${certificado.id}/amend`)).send({
    motivo_enmienda: 'Corrección E2E del valor de U capturado',
  });
  expect(enmienda.status).toBe(201);
  expect(enmienda.body.data.original.estado).toBe('superseded');
  expect(enmienda.body.data.enmienda.supersede_a_id).toBe(certificado.id);
  expect(enmienda.body.data.enmienda.estado).toBe('borrador');
  expect(enmienda.body.data.enmienda.acreditado).toBe(acreditado);

  const enmendarDeNuevo = await auth(request(app).post(`/api/work-orders/certificates/${certificado.id}/amend`)).send({
    motivo_enmienda: 'segunda enmienda sobre el original ya superseded',
  });
  expect(enmendarDeNuevo.status).toBe(409);

  const firmarEnmienda = await auth(request(app).post(`/api/work-orders/certificates/${enmienda.body.data.enmienda.id}/sign`), firmarToken);
  expect(firmarEnmienda.status).toBe(201);

  const emitirEnmienda = await auth(request(app).put(`/api/work-orders/certificates/${enmienda.body.data.enmienda.id}/estado`)).send({ estado: 'emitido' });
  expect(emitirEnmienda.status).toBe(200);

  return { certificadoFinal: emitirEnmienda.body.data, firmaInicial };
}
