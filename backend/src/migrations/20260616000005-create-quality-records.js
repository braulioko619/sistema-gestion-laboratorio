'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quality_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tipo_indicador: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      valor: {
        type: Sequelize.FLOAT,
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
      estado_cumplimiento: {
        type: Sequelize.ENUM('conforme', 'no_conforme', 'alerta'),
        defaultValue: 'conforme',
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      registrado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('quality_records', ['tipo_indicador']);
    await queryInterface.addIndex('quality_records', ['registrado_por']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quality_records');
  },
};
