'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('quote_items', 'acreditado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Ítem cotizado bajo acreditación INN (Etapa 1)',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('quote_items', 'acreditado');
  },
};
