'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('work_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
      fecha_ingreso: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_compromiso: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      fecha_entrega: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM(
          'recibida',
          'en_proceso',
          'calibrada',
          'certificado_emitido',
          'entregada',
          'cancelada'
        ),
        allowNull: false,
        defaultValue: 'recibida',
      },
      responsable_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.createTable('work_order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      orden_trabajo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'work_orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      instrumento_cliente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'client_instruments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'calibrado', 'rechazado'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      condicion_recepcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resultado: {
        type: Sequelize.ENUM('conforme', 'no_conforme'),
        allowNull: true,
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.createTable('calibration_certificates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      orden_trabajo_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'work_order_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_emision: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      fecha_calibracion: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'firmado', 'emitido', 'enviado'),
        allowNull: false,
        defaultValue: 'borrador',
      },
      nombre_original: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      nombre_almacenado: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      tipo_mime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tamano_bytes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enviado_a: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fecha_envio: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estado_envio: {
        type: Sequelize.ENUM('pendiente', 'enviado', 'fallido'),
        allowNull: true,
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

    await queryInterface.addIndex('work_orders', ['codigo']);
    await queryInterface.addIndex('work_orders', ['cliente_id']);
    await queryInterface.addIndex('work_orders', ['estado']);
    await queryInterface.addIndex('work_orders', ['fecha_ingreso']);
    await queryInterface.addIndex('work_order_items', ['orden_trabajo_id']);
    await queryInterface.addIndex('work_order_items', ['instrumento_cliente_id']);
    await queryInterface.addIndex(
      'work_order_items',
      ['orden_trabajo_id', 'instrumento_cliente_id'],
      { unique: true, name: 'work_order_items_orden_instrumento_unique' }
    );
    await queryInterface.addIndex('calibration_certificates', ['codigo']);
    await queryInterface.addIndex('calibration_certificates', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('calibration_certificates');
    await queryInterface.dropTable('work_order_items');
    await queryInterface.dropTable('work_orders');
  },
};
