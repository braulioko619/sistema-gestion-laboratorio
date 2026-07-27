const { sequelize, Role, User, PersonnelAuthorization } = require('../../models');
const { estaAutorizado } = require('../PersonnelAuthorizationService');

let tecnico;
let autorizador;

beforeAll(async () => {
  const [rol] = await Role.findOrCreate({ where: { nombre: 'tecnico_test_2_5' }, defaults: { permisos: [] } });
  tecnico = await User.create({ email: `tecnico.${Date.now()}@test.com`, nombre: 'Técnico', role_id: rol.id, estado: 'activo' });
  autorizador = await User.create({ email: `autorizador.${Date.now()}@test.com`, nombre: 'Autorizador', role_id: rol.id, estado: 'activo' });
});

afterAll(async () => {
  await sequelize.close();
});

test('sin ninguna autorización, no está autorizado', async () => {
  const resultado = await estaAutorizado(tecnico.id, 'Masa');
  expect(resultado.autorizado).toBe(false);
});

test('con una autorización vigente sin vencimiento, está autorizado (y la búsqueda no distingue mayúsculas)', async () => {
  await PersonnelAuthorization.create({
    user_id: tecnico.id,
    actividad: 'Calibración de masa',
    magnitud: 'Masa',
    autorizado_por: autorizador.id,
    fecha_autorizacion: new Date().toISOString().split('T')[0],
    estado: 'vigente',
  });

  const resultado = await estaAutorizado(tecnico.id, 'MASA');
  expect(resultado.autorizado).toBe(true);
});

test('una autorización con fecha_vencimiento pasada NO cuenta como vigente, aunque estado siga en "vigente"', async () => {
  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  await PersonnelAuthorization.create({
    user_id: tecnico.id,
    actividad: 'Calibración de presión',
    magnitud: 'Presion',
    autorizado_por: autorizador.id,
    fecha_autorizacion: ayer,
    fecha_vencimiento: ayer,
    estado: 'vigente',
  });

  const resultado = await estaAutorizado(tecnico.id, 'Presion');
  expect(resultado.autorizado).toBe(false);
});

test('una autorización revocada no cuenta aunque no haya vencido', async () => {
  await PersonnelAuthorization.create({
    user_id: tecnico.id,
    actividad: 'Calibración de temperatura',
    magnitud: 'Temperatura',
    autorizado_por: autorizador.id,
    fecha_autorizacion: new Date().toISOString().split('T')[0],
    estado: 'revocada',
  });

  const resultado = await estaAutorizado(tecnico.id, 'Temperatura');
  expect(resultado.autorizado).toBe(false);
});
