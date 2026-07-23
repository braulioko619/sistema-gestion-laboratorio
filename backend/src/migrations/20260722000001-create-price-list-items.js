'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('price_list_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tipo_instrumento: { type: Sequelize.STRING, allowNull: false },
      protocolo: { type: Sequelize.STRING, allowNull: false },
      rango_aplicable: { type: Sequelize.STRING, allowNull: true },
      precio: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      moneda: { type: Sequelize.STRING, allowNull: false, defaultValue: 'CLP' },
      vigente: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notas: { type: Sequelize.TEXT, allowNull: true },
      creado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('price_list_items', ['tipo_instrumento']);
    await queryInterface.addIndex('price_list_items', ['vigente']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('price_list_items');
  },
};
