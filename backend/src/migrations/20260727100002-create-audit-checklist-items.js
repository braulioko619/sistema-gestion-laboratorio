'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_checklist_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      audit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'internal_audits', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      template_item_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'checklist_template_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Los siguientes campos son una copia (snapshot) de la plantilla al momento
      // de crear la auditoría, para que el informe no cambie si luego se edita
      // la plantilla maestra (mismo patrón que PriceListItem -> QuoteItem).
      orden: { type: Sequelize.INTEGER, allowNull: false },
      tipo: { type: Sequelize.STRING, allowNull: false, defaultValue: 'item' },
      clausula: { type: Sequelize.STRING, allowNull: true },
      texto: { type: Sequelize.TEXT, allowNull: false },
      // Estado propio de esta auditoría:
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, // false = "no aplica a esta auditoría" (desactivado por el auditor)
      evaluacion: { type: Sequelize.STRING, allowNull: true }, // 'C' | 'NC' | 'OM' | 'N/A'
      evidencia: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('audit_checklist_items', ['audit_id']);
    await queryInterface.addIndex('audit_checklist_items', ['audit_id', 'orden']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_checklist_items');
  },
};
