'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('checklist_template_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      orden: { type: Sequelize.INTEGER, allowNull: false },
      tipo: { type: Sequelize.STRING, allowNull: false, defaultValue: 'item' }, // 'titulo' | 'item'
      clausula: { type: Sequelize.STRING, allowNull: true },
      texto: { type: Sequelize.TEXT, allowNull: false },
      vigente: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      creado_por: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('checklist_template_items', ['orden']);
    await queryInterface.addIndex('checklist_template_items', ['vigente']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('checklist_template_items');
  },
};
