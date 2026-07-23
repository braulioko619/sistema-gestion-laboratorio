'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Nueva acción de auditoría: envío de certificados de calibración por correo
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_audit_logs_accion" ADD VALUE IF NOT EXISTS 'enviar';`
    );
  },

  down: async () => {
    // Nota: PostgreSQL no permite eliminar valores de un ENUM;
    // el valor 'enviar' queda en el tipo sin efectos adversos.
  },
};
