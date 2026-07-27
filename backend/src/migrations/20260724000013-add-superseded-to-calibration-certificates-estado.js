'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Nuevo estado terminal (tarea 2.9 / D4): un certificado emitido nunca se
    // edita, se enmienda — el original queda 'superseded' pero conserva su
    // fila (ISO 17025 7.8.8 exige preservar el documento original, no
    // borrarlo). Migración separada de la que agrega supersede_a_id/
    // motivo_enmienda para que el ALTER TYPE quede confirmado antes de que
    // otra migración use el valor nuevo (mismo cuidado que
    // 20260724000003-add-lista-para-facturar-to-work-orders-estado.js).
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_calibration_certificates_estado" ADD VALUE IF NOT EXISTS 'superseded';`
    );
  },

  down: async () => {
    // PostgreSQL no permite eliminar valores de un ENUM;
    // el valor 'superseded' queda en el tipo sin efectos adversos.
  },
};
