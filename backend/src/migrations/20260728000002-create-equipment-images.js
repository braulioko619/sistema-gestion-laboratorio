'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('equipment_images', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nombre_original: { type: Sequelize.STRING, allowNull: false },
      nombre_almacenado: { type: Sequelize.STRING, allowNull: false, unique: true },
      tipo_mime: { type: Sequelize.STRING, allowNull: true },
      tamano_bytes: { type: Sequelize.INTEGER, allowNull: true },
      es_principal: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      subido_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('equipment_images', ['equipment_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('equipment_images');
  },
};
