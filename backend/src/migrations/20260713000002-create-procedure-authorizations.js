'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('procedure_authorizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      autorizado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      alcance: { type: Sequelize.TEXT, allowNull: true },
      fecha_autorizacion: { type: Sequelize.DATE, allowNull: false },
      fecha_vencimiento: { type: Sequelize.DATE, allowNull: true },
      estado: {
        type: Sequelize.ENUM('autorizado', 'revocado'),
        allowNull: false,
        defaultValue: 'autorizado',
      },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('procedure_authorizations', ['document_id']);
    await queryInterface.addIndex('procedure_authorizations', ['user_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('procedure_authorizations');
  },
};
