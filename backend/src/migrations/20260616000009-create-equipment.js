'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('equipment', {
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
      nombre: {
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
      ubicacion: {
        type: Sequelize.STRING,
        allowNull: true,
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
      estado: {
        type: Sequelize.ENUM(
          'operativo',
          'en_calibracion',
          'en_mantenimiento',
          'fuera_servicio',
          'dado_de_baja'
        ),
        allowNull: false,
        defaultValue: 'operativo',
      },
      fecha_ingreso: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      proxima_calibracion: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      proximo_mantenimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      proxima_verificacion: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      registrado_por: {
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

    await queryInterface.createTable('equipment_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: {
        type: Sequelize.ENUM(
          'calibracion',
          'mantenimiento',
          'verificacion_intermedia'
        ),
        allowNull: false,
      },
      fecha_realizacion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      proveedor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      certificado_numero: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      trazabilidad: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resultado: {
        type: Sequelize.ENUM('conforme', 'no_conforme'),
        allowNull: true,
      },
      proxima_fecha: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      registrado_por: {
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

    await queryInterface.addIndex('equipment', ['codigo']);
    await queryInterface.addIndex('equipment', ['estado']);
    await queryInterface.addIndex('equipment', ['proxima_calibracion']);
    await queryInterface.addIndex('equipment_events', ['equipment_id']);
    await queryInterface.addIndex('equipment_events', ['tipo']);
    await queryInterface.addIndex('equipment_events', ['fecha_realizacion']);

    // Nueva fuente de NC: hallazgos originados en equipos (calibración no conforme)
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_non_conformities_fuente" ADD VALUE IF NOT EXISTS 'equipo';`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('equipment_events');
    await queryInterface.dropTable('equipment');
    // Nota: PostgreSQL no permite eliminar valores de un ENUM;
    // el valor 'equipo' queda en el tipo sin efectos adversos.
  },
};
