'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('work_orders', 'quote_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'quotes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Cotización de origen, si la OT se creó a partir de una (nullable: OT sin cotización)',
    });

    await queryInterface.addIndex('work_orders', ['quote_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('work_orders', 'quote_id');
  },
};
