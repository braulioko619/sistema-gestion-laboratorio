// Tarea 4.5: script de verificación de la cadena de hashes de audit_logs
// (D9). Recorre toda la tabla en orden de inserción real ("secuencia") y
// recalcula cada hash con la MISMA función SQL (calcular_hash_audit_log)
// que usa el trigger que los generó al insertar — así la verificación
// nunca puede divergir de cómo se calcularon en primer lugar.
//
// Uso: node scripts/verify-audit-chain.js
// Exit code 0 = cadena íntegra. Exit code 1 = se encontró al menos una
// fila rota (hash recalculado no coincide, o el enlace con la fila
// anterior no coincide) — imprime el detalle de cada fila afectada.
require('dotenv').config();
const { sequelize } = require('../src/models');

const GENESIS = '0'.repeat(64);

async function main() {
  const [filas] = await sequelize.query(`
    WITH cadena AS (
      SELECT
        id,
        secuencia,
        "timestamp",
        entidad,
        accion,
        hash_anterior,
        hash_actual,
        LAG(hash_actual) OVER (ORDER BY secuencia) AS hash_anterior_esperado,
        calcular_hash_audit_log(
          hash_anterior, id, usuario_id, accion::text, entidad, entidad_id,
          cambios_anteriores, cambios_nuevos, detalles, ip_address, "timestamp"
        ) AS hash_actual_recalculado
      FROM audit_logs
    )
    SELECT id, secuencia, "timestamp", entidad, accion, hash_anterior, hash_actual,
           COALESCE(hash_anterior_esperado, $1) AS hash_anterior_esperado,
           hash_actual_recalculado
    FROM cadena
    WHERE hash_anterior <> COALESCE(hash_anterior_esperado, $1)
       OR hash_actual <> hash_actual_recalculado
    ORDER BY secuencia;
  `, { bind: [GENESIS] });

  const [[{ total }]] = await sequelize.query('SELECT COUNT(*)::int AS total FROM audit_logs;');

  if (filas.length === 0) {
    console.log(`Cadena íntegra: ${total} fila(s) verificada(s), sin discrepancias.`);
    await sequelize.close();
    process.exit(0);
  }

  console.error(`CADENA ROTA: ${filas.length} de ${total} fila(s) no coinciden con el hash esperado.`);
  filas.forEach((f) => {
    const problemas = [];
    if (f.hash_anterior !== f.hash_anterior_esperado) problemas.push('hash_anterior no enlaza con la fila previa');
    if (f.hash_actual !== f.hash_actual_recalculado) problemas.push('hash_actual no coincide con el recalculado (contenido alterado)');
    console.error(`  secuencia=${f.secuencia} id=${f.id} entidad=${f.entidad} accion=${f.accion} timestamp=${f.timestamp} -> ${problemas.join('; ')}`);
  });
  await sequelize.close();
  process.exit(1);
}

main().catch((error) => {
  console.error('Error verificando la cadena de audit_logs:', error.message);
  process.exit(1);
});
