'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Referencia la VERSIÓN específica de la plantilla (no la plantilla en
    // general): igual que calibration_data_files.template_version_id (tarea
    // 2.3), así una entrada queda ligada para siempre al schema exacto
    // contra el que se validó, aunque la plantilla tenga versiones más
    // nuevas después. Sin restricción de unicidad por ítem — histórico
    // append-only, mismo criterio que calibration_data_files: un ítem puede
    // tener varias capturas en distintos momentos.
    await queryInterface.createTable('calibration_form_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      work_order_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'work_order_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      form_template_version_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'calibration_form_template_versions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Valores capturados, campo->valor; validados contra el schema de la versión de plantilla referenciada',
      },
      estado: {
        type: Sequelize.ENUM('borrador', 'confirmado'),
        allowNull: false,
        defaultValue: 'borrador',
      },
      capturado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_captura: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      confirmado_por: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_confirmacion: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('calibration_form_entries', ['work_order_item_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('calibration_form_entries');
  },
};
