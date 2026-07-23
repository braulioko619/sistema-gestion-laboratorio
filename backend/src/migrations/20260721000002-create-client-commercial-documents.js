'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('client_commercial_documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      orden_trabajo_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      documento_relacionado_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'client_commercial_documents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Ej: la nota de crédito que corrige una factura, o la factura que cobra una orden de compra',
      },
      tipo: {
        type: Sequelize.ENUM('orden_compra', 'factura', 'nota_credito'),
        allowNull: false,
      },
      numero: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Folio/número del documento (el que emite el cliente o el sistema de facturación)',
      },
      fecha_emision: { type: Sequelize.DATEONLY, allowNull: false },
      monto: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
      moneda: { type: Sequelize.STRING, allowNull: false, defaultValue: 'CLP' },
      estado: {
        type: Sequelize.ENUM('vigente', 'anulado'),
        allowNull: false,
        defaultValue: 'vigente',
      },
      notas: { type: Sequelize.TEXT, allowNull: true },
      nombre_original: { type: Sequelize.STRING, allowNull: true },
      nombre_almacenado: { type: Sequelize.STRING, allowNull: true, unique: true },
      tipo_mime: { type: Sequelize.STRING, allowNull: true },
      tamano_bytes: { type: Sequelize.INTEGER, allowNull: true },
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

    await queryInterface.addIndex('client_commercial_documents', ['cliente_id']);
    await queryInterface.addIndex('client_commercial_documents', ['orden_trabajo_id']);
    await queryInterface.addIndex('client_commercial_documents', ['tipo']);
    await queryInterface.addIndex('client_commercial_documents', ['estado']);
    await queryInterface.addIndex('client_commercial_documents', ['numero']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('client_commercial_documents');
  },
};
