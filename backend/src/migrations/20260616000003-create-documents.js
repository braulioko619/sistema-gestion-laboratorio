'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tipo_documento: {
        type: Sequelize.ENUM(
          'procedimiento',
          'politica',
          'formulario',
          'reporte',
          'instructivo',
          'otro'
        ),
        defaultValue: 'procedimiento',
      },
      contenido: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      version_actual: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'publicado', 'archivado'),
        defaultValue: 'borrador',
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
      modificado_por: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      fecha_publicacion: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('documents', ['creado_por']);
    await queryInterface.addIndex('documents', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('documents');
  },
};
