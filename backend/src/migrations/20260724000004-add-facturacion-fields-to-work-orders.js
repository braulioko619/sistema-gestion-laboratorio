'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('work_orders', 'facturada_externamente', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Marcada por la encargada de facturación externa; saca la OT de la bandeja "Por facturar"',
    });
    await queryInterface.addColumn('work_orders', 'fecha_facturacion_externa', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('work_orders', 'fecha_facturacion_externa');
    await queryInterface.removeColumn('work_orders', 'facturada_externamente');
  },
};
