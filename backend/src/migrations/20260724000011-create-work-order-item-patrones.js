'use strict';

// Qué patrón(es)/equipos de referencia del laboratorio se usaron para
// calibrar un ítem de OT. Many-to-many simple: una calibración puede usar
// varios patrones (ej. patrón de presión + termómetro ambiental).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_order_item_patrones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      work_order_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'work_order_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      agregado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('work_order_item_patrones', ['work_order_item_id', 'equipment_id'], {
      unique: true,
      name: 'work_order_item_patrones_unicidad',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('work_order_item_patrones');
  },
};
