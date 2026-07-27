'use strict';

// Bloquea UPDATE/DELETE/TRUNCATE sobre audit_logs a nivel de base de datos,
// para que la inviolabilidad del audit trail no dependa de que ningún
// controlador ni acceso directo a la BD respete la regla de negocio.
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_logs_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs es de solo escritura (INSERT); % no está permitido', TG_OP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER audit_logs_immutable
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_modification();
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER audit_logs_immutable_truncate
      BEFORE TRUNCATE ON audit_logs
      FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_logs_modification();
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS audit_logs_immutable_truncate ON audit_logs;');
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs;');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS prevent_audit_logs_modification();');
  },
};
