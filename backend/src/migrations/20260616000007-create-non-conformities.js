'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('non_conformities', {
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
      fuente: {
        type: Sequelize.ENUM(
          'registro_calidad',
          'auditoria_interna',
          'queja_cliente',
          'proveedor',
          'equipo',
          'otro'
        ),
        allowNull: false,
        defaultValue: 'otro',
      },
      quality_record_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'quality_records',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      clasificacion: {
        type: Sequelize.ENUM('menor', 'mayor', 'critica'),
        allowNull: false,
        defaultValue: 'menor',
      },
      correccion_inmediata: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      decision_trabajo: {
        type: Sequelize.ENUM(
          'continuar',
          'suspender',
          'repetir',
          'notificar_cliente'
        ),
        allowNull: true,
      },
      analisis_causa_raiz: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      accion_correctiva: {
        type: Sequelize.TEXT,
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
      fecha_compromiso: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      verificacion_eficacia: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      eficaz: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      verificado_por: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_verificacion: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM(
          'abierta',
          'en_tratamiento',
          'en_verificacion',
          'cerrada'
        ),
        allowNull: false,
        defaultValue: 'abierta',
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

    await queryInterface.addIndex('non_conformities', ['codigo']);
    await queryInterface.addIndex('non_conformities', ['estado']);
    await queryInterface.addIndex('non_conformities', ['fuente']);
    await queryInterface.addIndex('non_conformities', ['quality_record_id']);
    await queryInterface.addIndex('non_conformities', ['responsable_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('non_conformities');
  },
};
