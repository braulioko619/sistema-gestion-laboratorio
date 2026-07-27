'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('certificate_signatures', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      certificate_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'calibration_certificates', key: 'id' },
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
      rol_firma: {
        type: Sequelize.ENUM('tecnico', 'supervisor', 'signatario_inn'),
        allowNull: false,
      },
      tipo_firma: {
        type: Sequelize.ENUM('simple', 'avanzada'),
        allowNull: false,
        defaultValue: 'simple',
        comment: 'simple = D5 (Etapa 2); avanzada = FEA vía proveedor, tarea 4.3',
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      sha256_pdf_firmado: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      proveedor_fea: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      evidencia_fea: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('certificate_signatures', ['certificate_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('certificate_signatures');
  },
};
