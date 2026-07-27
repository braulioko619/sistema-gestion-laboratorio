'use strict';

// Tarea 4.5 (D9, opcional): encadena cada fila de audit_logs con el hash de
// la anterior (blockchain-style, sin blockchain), como evidencia adicional
// de no-manipulación por encima del trigger de inmutabilidad de la tarea
// 0.2. Ese trigger ya bloquea UPDATE/DELETE/TRUNCATE a nivel de BD, así que
// esta cadena es defensa en profundidad: detecta manipulación incluso si
// alguien con privilegios suficientes deshabilitara ese trigger
// temporalmente para editar una fila y volviera a habilitarlo.
//
// `calcular_hash_audit_log` es una función SQL separada (no solo lógica
// dentro del trigger) a propósito: la usa tanto el trigger de INSERT como
// la consulta de verificación (scripts/verify-audit-chain.js), así que
// nunca puede haber drift entre "cómo se calculó" y "cómo se verifica" —
// es literalmente la misma función en ambos casos.
//
// Todo el up() corre dentro de una sola transacción explícita: si el
// backfill fallara a mitad de camino, el ALTER TABLE ... DISABLE TRIGGER
// audit_logs_immutable de más abajo se revierte solo en vez de dejar la
// tabla sin su protección de inmutabilidad (ver docs/PLAN_DESARROLLO.md,
// tarea 4.5 — encontrado exactamente así en el primer intento de esta
// migración, sin la transacción).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      const query = (sql, options = {}) => queryInterface.sequelize.query(sql, { ...options, transaction: t });

      // pgcrypto: provee digest() para SHA-256 (D1, mismo estándar que el
      // resto del proyecto usa para archivos).
      await query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

      await queryInterface.addColumn('audit_logs', 'secuencia', {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        comment: 'Orden de inserción real, independiente de "timestamp" (que puede repetirse entre filas concurrentes) — es la base de la cadena de hashes.',
      }, { transaction: t });
      await queryInterface.addColumn('audit_logs', 'hash_anterior', {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'hash_actual de la fila previa en la cadena, o 64 ceros para la primera fila (génesis).',
      }, { transaction: t });
      await queryInterface.addColumn('audit_logs', 'hash_actual', {
        type: Sequelize.STRING(64),
        allowNull: true,
      }, { transaction: t });

      await query(`
        CREATE OR REPLACE FUNCTION calcular_hash_audit_log(
          p_hash_anterior TEXT,
          p_id UUID,
          p_usuario_id UUID,
          p_accion TEXT,
          p_entidad TEXT,
          p_entidad_id UUID,
          p_cambios_anteriores JSONB,
          p_cambios_nuevos JSONB,
          p_detalles TEXT,
          p_ip_address TEXT,
          p_timestamp TIMESTAMPTZ
        ) RETURNS TEXT AS $$
          SELECT encode(
            digest(
              COALESCE(p_hash_anterior, '') ||
              p_id::text ||
              COALESCE(p_usuario_id::text, '') ||
              p_accion ||
              p_entidad ||
              COALESCE(p_entidad_id::text, '') ||
              COALESCE(p_cambios_anteriores::text, '') ||
              COALESCE(p_cambios_nuevos::text, '') ||
              COALESCE(p_detalles, '') ||
              COALESCE(p_ip_address, '') ||
              -- extract(epoch ...) en vez de p_timestamp::text: el texto de
              -- un TIMESTAMPTZ se formatea según el TimeZone de la SESIÓN
              -- que ejecuta la consulta (la app fuerza UTC vía Sequelize,
              -- pero psql u otra herramienta de verificación podría usar la
              -- zona horaria del SO) — el mismo instante produciría textos
              -- distintos y por lo tanto hashes distintos según quién
              -- verifique. epoch es la misma cifra sin importar la sesión.
              extract(epoch FROM p_timestamp)::text,
              'sha256'
            ),
            'hex'
          );
        $$ LANGUAGE sql IMMUTABLE;
      `);

      await query(`
        CREATE OR REPLACE FUNCTION hash_chain_audit_logs() RETURNS TRIGGER AS $$
        DECLARE
          v_prev_hash TEXT;
        BEGIN
          -- Serializa inserciones concurrentes: sin esto, dos INSERT en
          -- paralelo podrían leer el mismo "último hash" y bifurcar la
          -- cadena en vez de encadenarse en secuencia.
          PERFORM pg_advisory_xact_lock(hashtext('audit_logs_hash_chain'));

          SELECT hash_actual INTO v_prev_hash FROM audit_logs ORDER BY secuencia DESC LIMIT 1;
          NEW.hash_anterior := COALESCE(v_prev_hash, repeat('0', 64));
          NEW.hash_actual := calcular_hash_audit_log(
            NEW.hash_anterior, NEW.id, NEW.usuario_id, NEW.accion::text, NEW.entidad, NEW.entidad_id,
            NEW.cambios_anteriores, NEW.cambios_nuevos, NEW.detalles, NEW.ip_address, NEW.timestamp
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await query(`
        CREATE TRIGGER audit_logs_hash_chain
        BEFORE INSERT ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION hash_chain_audit_logs();
      `);

      // Backfill: las filas ya existentes (creadas antes de este trigger) no
      // tienen hash. Se encadenan aquí mismo, en orden de "secuencia" (recién
      // asignada arriba en el orden real de inserción), para que la cadena
      // sea continua desde la primera fila real de la tabla en vez de
      // arrancar recién en la próxima inserción. El trigger de inmutabilidad
      // de la tarea 0.2 bloquea UPDATE incondicionalmente (incluido este
      // backfill), así que se deshabilita solo para este bloque.
      await query('ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_immutable;');
      await query(`
        DO $$
        DECLARE
          fila RECORD;
          v_prev_hash TEXT := repeat('0', 64);
        BEGIN
          FOR fila IN
            SELECT * FROM audit_logs ORDER BY secuencia ASC
          LOOP
            UPDATE audit_logs SET
              hash_anterior = v_prev_hash,
              hash_actual = calcular_hash_audit_log(
                v_prev_hash, fila.id, fila.usuario_id, fila.accion::text, fila.entidad, fila.entidad_id,
                fila.cambios_anteriores, fila.cambios_nuevos, fila.detalles, fila.ip_address, fila.timestamp
              )
            WHERE id = fila.id;
            v_prev_hash := calcular_hash_audit_log(
              v_prev_hash, fila.id, fila.usuario_id, fila.accion::text, fila.entidad, fila.entidad_id,
              fila.cambios_anteriores, fila.cambios_nuevos, fila.detalles, fila.ip_address, fila.timestamp
            );
          END LOOP;
        END $$;
      `);
      await query('ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_immutable;');
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      const query = (sql) => queryInterface.sequelize.query(sql, { transaction: t });
      await query('DROP TRIGGER IF EXISTS audit_logs_hash_chain ON audit_logs;');
      await query('DROP FUNCTION IF EXISTS hash_chain_audit_logs();');
      await query('DROP FUNCTION IF EXISTS calcular_hash_audit_log(TEXT, UUID, UUID, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, TIMESTAMPTZ);');
      await queryInterface.removeColumn('audit_logs', 'hash_actual', { transaction: t });
      await queryInterface.removeColumn('audit_logs', 'hash_anterior', { transaction: t });
      await queryInterface.removeColumn('audit_logs', 'secuencia', { transaction: t });
    });
  },
};
