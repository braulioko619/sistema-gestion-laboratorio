'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('samples', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      numero_muestra: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Correlativo único e irrepetible asignado al recibir la muestra (MU-2026-001)',
      },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      instrumento_cliente_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'client_instruments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tipo_instrumento: { type: Sequelize.STRING, allowNull: false },
      marca: { type: Sequelize.STRING, allowNull: true },
      modelo: { type: Sequelize.STRING, allowNull: true },
      numero_serie: { type: Sequelize.STRING, allowNull: true },
      condicion_recepcion: { type: Sequelize.TEXT, allowNull: true },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      fecha_recepcion: { type: Sequelize.DATEONLY, allowNull: false },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendiente', // 'pendiente' | 'asignada' | 'rechazada'
      },
      work_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      work_order_item_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'work_order_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
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

    await queryInterface.addIndex('samples', ['numero_muestra']);
    await queryInterface.addIndex('samples', ['estado']);
    await queryInterface.addIndex('samples', ['cliente_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('samples');
  },
};
