'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Nuevo estado intermedio entre certificado_emitido y entregada: la OT
    // queda lista para que facturación externa la procese.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_work_orders_estado" ADD VALUE IF NOT EXISTS 'lista_para_facturar';`
    );
  },

  down: async () => {
    // PostgreSQL no permite eliminar valores de un ENUM;
    // el valor 'lista_para_facturar' queda en el tipo sin efectos adversos.
  },
};
