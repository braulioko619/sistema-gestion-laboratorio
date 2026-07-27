const { sequelize, AuditLog } = require('../../models');

afterAll(async () => {
  await sequelize.close();
});

test('UPDATE sobre audit_logs es rechazado por el trigger de inmutabilidad', async () => {
  const log = await AuditLog.create({ accion: 'crear', entidad: 'test_inmutabilidad', detalles: 'seed-update' });

  await expect(
    sequelize.query('UPDATE audit_logs SET detalles = :detalles WHERE id = :id', {
      replacements: { detalles: 'alterado', id: log.id },
    })
  ).rejects.toThrow(/solo escritura/);
});

test('DELETE sobre audit_logs es rechazado por el trigger de inmutabilidad', async () => {
  const log = await AuditLog.create({ accion: 'crear', entidad: 'test_inmutabilidad', detalles: 'seed-delete' });

  await expect(
    sequelize.query('DELETE FROM audit_logs WHERE id = :id', {
      replacements: { id: log.id },
    })
  ).rejects.toThrow(/solo escritura/);
});

// Tarea 4.5 (D9): cadena de hashes por encima de la inmutabilidad de arriba.
describe('cadena de hashes (tarea 4.5)', () => {
  test('cada fila nueva encadena con el hash_actual de la fila anterior', async () => {
    const primera = await AuditLog.create({ accion: 'crear', entidad: 'test_hash_chain', detalles: 'fila 1' });
    const segunda = await AuditLog.create({ accion: 'crear', entidad: 'test_hash_chain', detalles: 'fila 2' });

    expect(primera.hash_actual).toHaveLength(64);
    expect(segunda.hash_anterior).toBe(primera.hash_actual);
    expect(segunda.hash_actual).not.toBe(primera.hash_actual);
  });

  test('el hash es independiente del TimeZone de la sesión que lo calcula (evita el bug de p_timestamp::text)', async () => {
    const log = await AuditLog.create({ accion: 'crear', entidad: 'test_hash_chain_tz', detalles: 'fila tz' });

    const recalcularConTz = async (tz) => {
      const [[fila]] = await sequelize.query(
        `SET LOCAL TimeZone = :tz;
         SELECT calcular_hash_audit_log(hash_anterior, id, usuario_id, accion::text, entidad, entidad_id, cambios_anteriores, cambios_nuevos, detalles, ip_address, "timestamp") AS h
         FROM audit_logs WHERE id = :id;`,
        { replacements: { tz, id: log.id } }
      );
      return fila.h;
    };

    const hashUtc = await recalcularConTz('UTC');
    const hashSantiago = await recalcularConTz('America/Santiago');

    expect(hashUtc).toBe(log.hash_actual);
    expect(hashSantiago).toBe(log.hash_actual);
  });

  test('verify-audit-chain detecta una fila alterada fuera del trigger de inmutabilidad', async () => {
    const log = await AuditLog.create({ accion: 'crear', entidad: 'test_hash_chain_tamper', detalles: 'contenido original' });

    // Simula el escenario que 4.5 existe para cubrir: alguien con
    // privilegios suficientes deshabilita el trigger de inmutabilidad,
    // edita una fila, y lo reactiva.
    await sequelize.query('ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_immutable');
    await sequelize.query('UPDATE audit_logs SET detalles = :detalles WHERE id = :id', {
      replacements: { detalles: 'CONTENIDO ALTERADO', id: log.id },
    });
    await sequelize.query('ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_immutable');

    const [filasRotas] = await sequelize.query(`
      WITH cadena AS (
        SELECT id, hash_anterior, hash_actual,
          calcular_hash_audit_log(hash_anterior, id, usuario_id, accion::text, entidad, entidad_id, cambios_anteriores, cambios_nuevos, detalles, ip_address, "timestamp") AS recalculado
        FROM audit_logs
      )
      SELECT id FROM cadena WHERE id = :id AND hash_actual <> recalculado;
    `, { replacements: { id: log.id } });

    expect(filasRotas).toHaveLength(1);
    expect(filasRotas[0].id).toBe(log.id);
  });
});
