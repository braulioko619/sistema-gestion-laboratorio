'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quality_indicators', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tipo_indicador: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      unidad: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      limite_minimo: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      limite_maximo: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
    });

    await queryInterface.addIndex('quality_indicators', ['tipo_indicador']);
    await queryInterface.addIndex('quality_indicators', ['activo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quality_indicators');
  },
};
