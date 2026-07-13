'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('personnel_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: {
        type: Sequelize.ENUM(
          'formacion_academica',
          'capacitacion',
          'experiencia',
          'evaluacion_competencia'
        ),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      institucion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      referencia_certificado: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resultado: {
        type: Sequelize.ENUM('aprobado', 'reprobado', 'pendiente'),
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

    await queryInterface.createTable('personnel_authorizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      actividad: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alcance: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      autorizado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_autorizacion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('vigente', 'vencida', 'revocada'),
        allowNull: false,
        defaultValue: 'vigente',
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

    await queryInterface.addIndex('personnel_records', ['user_id']);
    await queryInterface.addIndex('personnel_records', ['tipo']);
    await queryInterface.addIndex('personnel_records', ['fecha_vencimiento']);
    await queryInterface.addIndex('personnel_authorizations', ['user_id']);
    await queryInterface.addIndex('personnel_authorizations', ['estado']);
    await queryInterface.addIndex('personnel_authorizations', ['fecha_vencimiento']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('personnel_authorizations');
    await queryInterface.dropTable('personnel_records');
  },
};
