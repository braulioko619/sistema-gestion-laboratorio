'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('software_validations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      modulo: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Módulo/tarea validada, ej: "Etapa 0 / 0.1 - Correlativos"',
      },
      version_sistema: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Referencia de versión o commit validado',
      },
      protocolo: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Qué se probó y con qué datos',
      },
      resultado: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      archivo_evidencia: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ejecutado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      aprobado_por: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('software_validations', ['modulo']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('software_validations');
  },
};
