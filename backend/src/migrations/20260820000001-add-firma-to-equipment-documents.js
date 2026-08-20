'use strict';

// Revisión y firma de los documentos de equipo (certificados de calibración,
// verificaciones y demás): quién los aprobó o rechazó, cuándo y por qué.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('equipment_documents', 'estado_firma', {
      type: Sequelize.ENUM('pendiente', 'aprobado', 'rechazado'),
      allowNull: false,
      defaultValue: 'pendiente',
      comment: 'Resultado de la revisión del documento por jefatura o calidad',
    });

    await queryInterface.addColumn('equipment_documents', 'firmado_por', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.addColumn('equipment_documents', 'firmado_en', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('equipment_documents', 'comentario_firma', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Obligatorio al rechazar: motivo del rechazo',
    });

    await queryInterface.addIndex('equipment_documents', ['estado_firma']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('equipment_documents', ['estado_firma']);
    await queryInterface.removeColumn('equipment_documents', 'comentario_firma');
    await queryInterface.removeColumn('equipment_documents', 'firmado_en');
    await queryInterface.removeColumn('equipment_documents', 'firmado_por');
    await queryInterface.removeColumn('equipment_documents', 'estado_firma');
    // El tipo ENUM queda huérfano en Postgres tras quitar la columna.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_equipment_documents_estado_firma";');
  },
};
