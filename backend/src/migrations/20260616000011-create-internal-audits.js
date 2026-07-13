'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('internal_audits', {
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
      alcance: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      criterios: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      auditor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      auditor_externo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fecha_planificada: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_realizacion: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM(
          'planificada',
          'en_curso',
          'completada',
          'cancelada'
        ),
        allowNull: false,
        defaultValue: 'planificada',
      },
      conclusiones: {
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

    await queryInterface.createTable('audit_findings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      audit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'internal_audits',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: {
        type: Sequelize.ENUM(
          'no_conformidad',
          'observacion',
          'oportunidad_mejora'
        ),
        allowNull: false,
      },
      clausula: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      non_conformity_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'non_conformities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('internal_audits', ['codigo']);
    await queryInterface.addIndex('internal_audits', ['estado']);
    await queryInterface.addIndex('internal_audits', ['fecha_planificada']);
    await queryInterface.addIndex('audit_findings', ['audit_id']);
    await queryInterface.addIndex('audit_findings', ['tipo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_findings');
    await queryInterface.dropTable('internal_audits');
  },
};
