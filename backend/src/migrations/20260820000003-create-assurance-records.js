'use strict';

// Registros (evidencia) de cada actividad de aseguramiento: informe del
// ensayo de aptitud, planilla de repetibilidad, carta de control, acta de
// testificación, etc. Sin borrado: es evidencia para auditoría, igual
// criterio que los adjuntos de QualityRecord y los documentos de equipo.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assurance_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      assurance_activity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'assurance_activities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      nombre_original: { type: Sequelize.STRING, allowNull: false },
      nombre_almacenado: { type: Sequelize.STRING, allowNull: false, unique: true },
      tipo_mime: { type: Sequelize.STRING, allowNull: true },
      tamano_bytes: { type: Sequelize.INTEGER, allowNull: true },
      subido_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('assurance_records', ['assurance_activity_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('assurance_records');
  },
};
