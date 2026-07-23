'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('client_addresses', {
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
        onDelete: 'CASCADE',
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'general',
        comment: 'Etiqueta libre para diferenciar la dirección (ej: facturación, despacho, bodega)',
      },
      etiqueta: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nombre corto opcional para identificarla (ej: "Sucursal Maipú")',
      },
      direccion: { type: Sequelize.STRING, allowNull: false },
      ciudad: { type: Sequelize.STRING, allowNull: true },
      principal: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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

    await queryInterface.createTable('client_contacts', {
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
        onDelete: 'CASCADE',
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'general',
        comment: 'Etiqueta libre para diferenciar el contacto (ej: facturación, certificados, comercial, órdenes de compra)',
      },
      nombre: { type: Sequelize.STRING, allowNull: true },
      cargo: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      telefono: { type: Sequelize.STRING, allowNull: true },
      principal: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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

    await queryInterface.addIndex('client_addresses', ['cliente_id']);
    await queryInterface.addIndex('client_addresses', ['tipo']);
    await queryInterface.addIndex('client_contacts', ['cliente_id']);
    await queryInterface.addIndex('client_contacts', ['tipo']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('client_contacts');
    await queryInterface.dropTable('client_addresses');
  },
};
