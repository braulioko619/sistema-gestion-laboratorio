'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quotes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo: { type: Sequelize.STRING, allowNull: false, unique: true },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'emitida', 'aceptada', 'rechazada', 'anulada'),
        allowNull: false,
        defaultValue: 'borrador',
      },
      fecha_emision: { type: Sequelize.DATEONLY, allowNull: true },
      fecha_vencimiento: { type: Sequelize.DATEONLY, allowNull: true },
      validez_dias: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      moneda: { type: Sequelize.STRING, allowNull: false, defaultValue: 'CLP' },
      descuento_porcentaje: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      iva_porcentaje: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 19 },
      subtotal: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      descuento_monto: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      iva_monto: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      condiciones: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.createTable('quote_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      cotizacion_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'quotes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      instrumento_cliente_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'client_instruments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tarifa_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'price_list_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      descripcion: { type: Sequelize.STRING, allowNull: false },
      tipo_instrumento: { type: Sequelize.STRING, allowNull: false },
      protocolo: { type: Sequelize.STRING, allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      precio_unitario: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('quotes', ['cliente_id']);
    await queryInterface.addIndex('quotes', ['estado']);
    await queryInterface.addIndex('quote_items', ['cotizacion_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('quote_items');
    await queryInterface.dropTable('quotes');
  },
};
