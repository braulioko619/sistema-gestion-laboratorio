'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      accion: {
        type: Sequelize.ENUM(
          'crear',
          'actualizar',
          'eliminar',
          'ver',
          'descargar',
          'aprobar',
          'rechazar',
          'publicar',
          'archivar'
        ),
        allowNull: false,
      },
      entidad: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entidad_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      cambios_anteriores: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      cambios_nuevos: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      detalles: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
    });

    await queryInterface.addIndex('audit_logs', ['usuario_id']);
    await queryInterface.addIndex('audit_logs', ['entidad']);
    await queryInterface.addIndex('audit_logs', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
  },
};
