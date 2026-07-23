'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quality_record_attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      record_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'quality_records', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nombre_original: { type: Sequelize.STRING, allowNull: false },
      nombre_almacenado: { type: Sequelize.STRING, allowNull: false, unique: true },
      tipo_mime: { type: Sequelize.STRING, allowNull: true },
      tamano_bytes: { type: Sequelize.INTEGER, allowNull: true },
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

    await queryInterface.addIndex('quality_record_attachments', ['record_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('quality_record_attachments');
  },
};
