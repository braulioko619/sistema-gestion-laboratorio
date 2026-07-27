// Test E2E de cierre de Etapa 1 (tarea 1.6): cotizar (1 ítem acreditado, 1 no)
// -> aceptar -> crear OT desde la cotización -> emitir ambos certificados ->
// la OT pasa sola a lista_para_facturar -> aparece en la bandeja de
// facturación -> marcarla como facturada la saca de la bandeja.
//
// No usa datos sembrados por seeders (evita el seeder roto de
// 20260616000001-seed-roles-and-admin.js, ver docs/PLAN_DESARROLLO.md):
// crea su propio usuario admin directamente contra los modelos, reusando el
// rol 'administrador' real vía findOrCreate (tarea 2.10: la versión anterior
// creaba un rol con nombre inventado, SE LOGUEABA con él, y recién después
// lo renombraba a 'administrador' — el JWT ya llevaba el nombre viejo
// horneado, así que authorizeRole rechazaba todo; y contra la BD de
// desarrollo el rename ni siquiera llegaba a correr porque 'administrador'
// ya existe como nombre de rol y `nombre` es UNIQUE. findOrCreate evita
// ambos problemas: reusa el rol si ya existe, lo crea si no, y el usuario
// nuevo se loguea con el nombre correcto desde el principio).
const request = require('supertest');
const app = require('../app');
const { sequelize, Role, User, AccreditationScope } = require('../models');
const { hashPassword } = require('../utils/auth');

let token;
let tokenSignatario;
let cliente_id;
let adminId;

async function loginComoRol(nombreRol, nombreUsuario) {
  const [rol] = await Role.findOrCreate({
    where: { nombre: nombreRol },
    defaults: { nombre: nombreRol, permisos: [] },
  });
  const email = `${nombreRol}.e2e16.${Date.now()}.${Math.random().toString(36).slice(2)}@laboratorio.com`;
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
  const admin = await loginComoRol('administrador', 'Admin E2E');
  token = admin.token;
  adminId = admin.userId;

  // Emitir un certificado acreditado exige firma de signatario_inn desde la
  // tarea 2.8 (posterior a cuando se escribió este test) — bootstrap
  // agregado en la tarea 2.10 junto con el resto del flujo de firma/reglas.
  const signatario = await loginComoRol('signatario_inn', 'Signatario E2E');
  tokenSignatario = signatario.token;
});

afterAll(async () => {
  await sequelize.close();
});

test('cadena completa: cotización con ítem acreditado y no acreditado -> OT -> certificados -> bandeja de facturación', async () => {
  const sufijo = Date.now();

  const clienteRes = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: `Cliente E2E ${sufijo}`, identificacion_fiscal: `E2E-${sufijo}`, email_contacto: `e2e${sufijo}@test.com` });
  expect(clienteRes.status).toBe(201);
  cliente_id = clienteRes.body.data.id;

  const instA = await request(app)
    .post(`/api/clients/${cliente_id}/instruments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ codigo_interno: `INST-E2E-A-${sufijo}`, tipo_instrumento: 'Manómetro' });
  const instB = await request(app)
    .post(`/api/clients/${cliente_id}/instruments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ codigo_interno: `INST-E2E-B-${sufijo}`, tipo_instrumento: 'Balanza' });
  expect(instA.status).toBe(201);
  expect(instB.status).toBe(201);

  const cotRes = await request(app)
    .post('/api/quotes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      cliente_id,
      items: [
        { instrumento_cliente_id: instA.body.data.id, descripcion: 'Manómetro acreditado', tipo_instrumento: 'Manómetro', protocolo: 'PC-05', cantidad: 1, precio_unitario: 10000, acreditado: true },
        { instrumento_cliente_id: instB.body.data.id, descripcion: 'Balanza no acreditada', tipo_instrumento: 'Balanza', protocolo: 'PM-01', cantidad: 1, precio_unitario: 5000, acreditado: false },
      ],
    });
  expect(cotRes.status).toBe(201);
  const cotizacion = cotRes.body.data;
  expect(cotizacion.items[0].acreditado).toBe(true);
  expect(cotizacion.items[1].acreditado).toBe(false);

  const aceptarRes = await request(app)
    .put(`/api/quotes/${cotizacion.id}/estado`)
    .set('Authorization', `Bearer ${token}`)
    .send({ estado: 'aceptada' });
  expect(aceptarRes.body.data.estado).toBe('aceptada');

  const otRes = await request(app)
    .post('/api/work-orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      cliente_id,
      quote_id: cotizacion.id,
      responsable_id: adminId,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      items: [
        { instrumento_cliente_id: instA.body.data.id, quote_item_id: cotizacion.items[0].id },
        { instrumento_cliente_id: instB.body.data.id, quote_item_id: cotizacion.items[1].id },
      ],
    });
  expect(otRes.status).toBe(201);
  const ot = otRes.body.data;
  expect(ot.cotizacion.id).toBe(cotizacion.id);

  const itemAcreditado = ot.items.find((it) => it.instrumento_cliente_id === instA.body.data.id);
  const itemNormal = ot.items.find((it) => it.instrumento_cliente_id === instB.body.data.id);
  expect(itemAcreditado.acreditado).toBe(true);
  expect(itemNormal.acreditado).toBe(false);

  // El motor de reglas de emisión (tarea 2.7, posterior a este test) exige
  // patrón + técnico autorizado + U/k + raw data para CUALQUIER certificado,
  // y además alcance INN vigente para uno acreditado. Se arma el mínimo para
  // cada ítem antes de intentar emitir — este test sigue enfocado en la
  // cadena comercial (cotización -> OT -> facturación), no en probar cada
  // regla una por una (eso ya lo cubre etapa2-guardian-excel-emision.test.js).
  const prepararItemParaEmision = async (item, magnitudSufijo) => {
    const magnitud = `Magnitud-E2E16-${sufijo}-${magnitudSufijo}`;

    const equipo = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${token}`)
      .send({ codigo: `PAT-E2E16-${sufijo}-${magnitudSufijo}`, nombre: 'Patrón E2E', magnitud });
    expect(equipo.status).toBe(201);

    if (item.acreditado) {
      await AccreditationScope.create({
        codigo_acreditacion: `OI-E2E16-${sufijo}`,
        tipo_organismo: 'INN',
        norma_acreditacion: 'ISO/IEC 17025',
        area: magnitud,
        item: `Calibración de ${magnitud}`,
        activo: true,
      });
    }

    const patron = await request(app)
      .post(`/api/work-orders/items/${item.id}/patrones`)
      .set('Authorization', `Bearer ${token}`)
      .send({ equipment_id: equipo.body.data.id });
    expect(patron.status).toBe(201);

    const autorizacion = await request(app)
      .post(`/api/personnel/${adminId}/authorizations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ actividad: `Calibración de ${magnitud}`, magnitud, fecha_autorizacion: '2020-01-01', fecha_vencimiento: '2099-01-01' });
    expect(autorizacion.status).toBe(201);

    const uyk = await request(app)
      .put(`/api/work-orders/items/${item.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ incertidumbre_U: 0.05, factor_k: 2 });
    expect(uyk.status).toBe(200);

    const rawData = await request(app)
      .post(`/api/work-orders/items/${item.id}/data-files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('archivo', Buffer.from(`raw-${sufijo}-${magnitudSufijo}`), 'raw.xlsx');
    expect(rawData.status).toBe(201);
  };

  await prepararItemParaEmision(itemAcreditado, 'A');
  await prepararItemParaEmision(itemNormal, 'B');

  const subirCertificado = (itemId) =>
    request(app)
      .post(`/api/work-orders/items/${itemId}/certificate`)
      .set('Authorization', `Bearer ${token}`)
      .attach('archivo', Buffer.from('%PDF-1.4\n%%EOF'), 'certificado.pdf');

  const cert1 = await subirCertificado(itemAcreditado.id);
  const cert2 = await subirCertificado(itemNormal.id);
  expect(cert1.status).toBe(201);
  expect(cert2.status).toBe(201);
  expect(cert1.body.data.acreditado).toBe(true);
  expect(cert2.body.data.acreditado).toBe(false);

  // Firmar (tarea 2.8, posterior a este test): obligatorio antes de emitir.
  // El certificado acreditado exige signatario_inn; el no acreditado lo
  // firma el propio responsable de la OT.
  const firmar1 = await request(app)
    .post(`/api/work-orders/certificates/${cert1.body.data.id}/sign`)
    .set('Authorization', `Bearer ${tokenSignatario}`);
  expect(firmar1.status).toBe(201);

  const firmar2 = await request(app)
    .post(`/api/work-orders/certificates/${cert2.body.data.id}/sign`)
    .set('Authorization', `Bearer ${token}`);
  expect(firmar2.status).toBe(201);

  // El motor de reglas (2.7) exige fecha_calibracion para poder evaluar
  // "patrón vigente a la fecha de calibración"; uploadCertificate (a
  // diferencia de generateCertificate) no la fija, así que se manda en la
  // misma petición que emite — updateCertificateEstado la guarda primero y
  // evalúa el motor de reglas con esa fecha ya aplicada.
  const emitir = (certId) =>
    request(app)
      .put(`/api/work-orders/certificates/${certId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'emitido', fecha_calibracion: '2026-07-20' });

  const emitir1 = await emitir(cert1.body.data.id);
  expect(emitir1.status).toBe(200);

  let otIntermedia = await request(app).get(`/api/work-orders/${ot.id}`).set('Authorization', `Bearer ${token}`);
  expect(otIntermedia.body.data.estado).not.toBe('lista_para_facturar');

  const emitir2 = await emitir(cert2.body.data.id);
  expect(emitir2.status).toBe(200);

  const otFinal = await request(app).get(`/api/work-orders/${ot.id}`).set('Authorization', `Bearer ${token}`);
  expect(otFinal.body.data.estado).toBe('lista_para_facturar');

  const bandeja = await request(app).get('/api/work-orders/billing-queue').set('Authorization', `Bearer ${token}`);
  expect(bandeja.body.data.some((o) => o.id === ot.id)).toBe(true);

  const marcar = await request(app)
    .patch(`/api/work-orders/${ot.id}/facturada-externamente`)
    .set('Authorization', `Bearer ${token}`);
  expect(marcar.status).toBe(200);

  const bandejaTrasMarcar = await request(app).get('/api/work-orders/billing-queue').set('Authorization', `Bearer ${token}`);
  expect(bandejaTrasMarcar.body.data.some((o) => o.id === ot.id)).toBe(false);
}, 30000);
