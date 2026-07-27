'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('work_order_items', 'acreditado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Heredado del quote_item al crear la OT desde una cotización aceptada; editable después solo por supervisor+',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('work_order_items', 'acreditado');
  },
};
