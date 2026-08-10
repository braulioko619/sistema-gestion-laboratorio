'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('equipment_documents', {
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
      categoria: {
        type: Sequelize.ENUM('manual', 'protocolo', 'ficha_tecnica', 'certificado_calibracion', 'otro'),
        allowNull: false,
        defaultValue: 'otro',
        comment: 'Documentación exigida por NCh-ISO/IEC 17025, SEC o ISP (manuales, protocolos, fichas técnicas, otros)',
      },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('equipment_documents', ['equipment_id']);
    await queryInterface.addIndex('equipment_documents', ['categoria']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('equipment_documents');
  },
};
