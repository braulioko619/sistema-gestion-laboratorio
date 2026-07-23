'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      identificacion_fiscal: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contacto_nombre: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_contacto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
      },
      creado_por: {
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

    await queryInterface.createTable('client_instruments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      codigo_interno: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      codigo_cliente: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tipo_instrumento: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      marca: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      modelo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      numero_serie: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rango_medida: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resolucion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unidad: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      proxima_fecha_calibracion: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo', 'dado_de_baja'),
        allowNull: false,
        defaultValue: 'activo',
      },
      creado_por: {
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

    await queryInterface.addIndex('clients', ['identificacion_fiscal']);
    await queryInterface.addIndex('clients', ['estado']);
    await queryInterface.addIndex('client_instruments', ['cliente_id']);
    await queryInterface.addIndex('client_instruments', ['codigo_interno']);
    await queryInterface.addIndex('client_instruments', ['proxima_fecha_calibracion']);
    await queryInterface.addIndex('client_instruments', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('client_instruments');
    await queryInterface.dropTable('clients');
  },
};
