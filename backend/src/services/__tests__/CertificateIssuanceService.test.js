const {
  sequelize, Role, User, Client, ClientInstrument, WorkOrder, WorkOrderItem,
  CalibrationCertificate, Equipment, WorkOrderItemPatron, CalibrationDataFile,
  PersonnelAuthorization, AccreditationScope,
} = require('../../models');
const { verificarEmision } = require('../CertificateIssuanceService');

let cliente;
let instrumento;
let ordenTrabajo;
let item;
let certificado;
let usuario;
let rolSignatario;

// Sufijo único por corrida: esta suite corre contra una BD Postgres real que
// no se limpia entre invocaciones de `npm test` (jest.setup.js solo migra,
// no trunca), así que un valor fijo aquí colisionaría con el
// AccreditationScope que la corrida anterior ya dejó cubriendo esta magnitud.
const MAGNITUD = `Presion_test_2_7_${Date.now()}`;

beforeAll(async () => {
  const [rol] = await Role.findOrCreate({ where: { nombre: 'rol_test_2_7' }, defaults: { permisos: [] } });
  usuario = await User.create({ email: `user.${Date.now()}@test.com`, nombre: 'Usuario Test', role_id: rol.id, estado: 'activo' });

  cliente = await Client.create({
    nombre: 'Cliente test 2.7', identificacion_fiscal: `CLI-${Date.now()}`, email_contacto: 'c@test.com', creado_por: usuario.id,
  });
  instrumento = await ClientInstrument.create({
    cliente_id: cliente.id, codigo_interno: `INST-${Date.now()}`, tipo_instrumento: 'Manómetro', creado_por: usuario.id,
  });
  ordenTrabajo = await WorkOrder.create({
    codigo: `OT-TEST-${Date.now()}`, cliente_id: cliente.id, fecha_ingreso: new Date().toISOString().split('T')[0], creado_por: usuario.id,
  });
  item = await WorkOrderItem.create({
    orden_trabajo_id: ordenTrabajo.id, instrumento_cliente_id: instrumento.id, acreditado: true,
  });
  certificado = await CalibrationCertificate.create({
    codigo: `CERT-TEST-${Date.now()}`, orden_trabajo_item_id: item.id, acreditado: true,
    fecha_calibracion: new Date().toISOString().split('T')[0], creado_por: usuario.id,
  });
});

afterAll(async () => {
  await sequelize.close();
});

test('sin nada resuelto: permitida=false y todas las reglas de datos faltantes fallan', async () => {
  const { permitida, checks } = await verificarEmision(certificado.id);
  expect(permitida).toBe(false);
  expect(checks.find((c) => c.regla === 'patron_vigente').paso).toBe(false);
  expect(checks.find((c) => c.regla === 'incertidumbre_presente').paso).toBe(false);
  expect(checks.find((c) => c.regla === 'raw_data_adjunto').paso).toBe(false);
  expect(checks.find((c) => c.regla === 'alcance_inn').paso).toBe(false);
});

test('regla incertidumbre_presente pasa cuando U y k están seteados', async () => {
  await item.update({ incertidumbre_U: 0.02, factor_k: 2 });
  const { checks } = await verificarEmision(certificado.id);
  expect(checks.find((c) => c.regla === 'incertidumbre_presente').paso).toBe(true);
});

test('regla patron_vigente falla con un patrón vencido y pasa con uno vigente', async () => {
  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const patronVencido = await Equipment.create({
    codigo: `PAT-VENC-${Date.now()}`, nombre: 'Patrón vencido', magnitud: MAGNITUD, estado: 'operativo',
    proxima_calibracion: ayer, registrado_por: usuario.id,
  });
  await WorkOrderItemPatron.create({ work_order_item_id: item.id, equipment_id: patronVencido.id, agregado_por: usuario.id });

  let resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'patron_vigente').paso).toBe(false);

  await WorkOrderItemPatron.destroy({ where: { work_order_item_id: item.id, equipment_id: patronVencido.id } });
  const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const patronVigente = await Equipment.create({
    codigo: `PAT-VIG-${Date.now()}`, nombre: 'Patrón vigente', magnitud: MAGNITUD, estado: 'operativo',
    proxima_calibracion: manana, registrado_por: usuario.id,
  });
  await WorkOrderItemPatron.create({ work_order_item_id: item.id, equipment_id: patronVigente.id, agregado_por: usuario.id });

  resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'patron_vigente').paso).toBe(true);
});

test('regla tecnico_autorizado pasa solo si el responsable de la OT está autorizado en la magnitud', async () => {
  let resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'tecnico_autorizado').paso).toBe(false);

  await ordenTrabajo.update({ responsable_id: usuario.id });
  resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'tecnico_autorizado').paso).toBe(false);

  await PersonnelAuthorization.create({
    user_id: usuario.id, actividad: 'Test 2.7', magnitud: MAGNITUD, autorizado_por: usuario.id,
    fecha_autorizacion: new Date().toISOString().split('T')[0], estado: 'vigente',
  });
  resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'tecnico_autorizado').paso).toBe(true);
});

test('regla raw_data_adjunto pasa al subir un archivo', async () => {
  let resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'raw_data_adjunto').paso).toBe(false);

  await CalibrationDataFile.create({
    work_order_item_id: item.id, nombre_original: 'raw.xlsx', archivo_almacenado: `${Date.now()}.xlsx`,
    sha256: 'a'.repeat(64), subido_por: usuario.id,
  });
  resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'raw_data_adjunto').paso).toBe(true);
});

test('reglas de acreditado (alcance_inn, signatario_disponible) y permitida=true al final', async () => {
  let resultado = await verificarEmision(certificado.id);
  expect(resultado.checks.find((c) => c.regla === 'alcance_inn').paso).toBe(false);
  // No se afirma que 'signatario_disponible' parta en false: es una regla
  // global (¿existe algún usuario signatario_inn activo en todo el sistema?),
  // no acotada a este certificado, así que otra suite que haya corrido antes
  // en la misma BD compartida (ej. el flujo de firma de 2.8/2.10) puede
  // haber creado ya un signatario_inn real. Lo que sí es determinista es que
  // sigue en true después de crear uno (abajo).

  [rolSignatario] = await Role.findOrCreate({ where: { nombre: 'signatario_inn_test_2_7' }, defaults: { permisos: [] } });
  await User.create({ email: `signatario.${Date.now()}@test.com`, nombre: 'Firmante Test', role_id: rolSignatario.id, estado: 'activo' });
  // El nombre de rol real es 'signatario_inn'; para no chocar con el
  // seeder de 0.4 ya aplicado en esta BD, se reutiliza si ya existe.
  const rolReal = (await Role.findOne({ where: { nombre: 'signatario_inn' } })) || rolSignatario;
  if (rolReal.id !== rolSignatario.id) {
    await User.create({ email: `signatario2.${Date.now()}@test.com`, nombre: 'Firmante Test 2', role_id: rolReal.id, estado: 'activo' });
  }

  await AccreditationScope.create({
    codigo_acreditacion: `OI-TEST-2-7-${Date.now()}`, tipo_organismo: 'INN', norma_acreditacion: 'ISO/IEC 17025',
    area: MAGNITUD, item: 'Item de prueba', activo: true,
  });

  const resultadoFinal = await verificarEmision(certificado.id);
  expect(resultadoFinal.checks.find((c) => c.regla === 'alcance_inn').paso).toBe(true);
  expect(resultadoFinal.checks.find((c) => c.regla === 'signatario_disponible').paso).toBe(true);
  expect(resultadoFinal.permitida).toBe(true);
});
