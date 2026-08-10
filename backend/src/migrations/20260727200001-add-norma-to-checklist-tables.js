'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('checklist_template_items', 'norma', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ISO17025',
      comment: 'ISO17025 | ISO17020 — a qué norma pertenece este punto de la plantilla',
    });
    await queryInterface.addColumn('checklist_template_items', 'fuente', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Origen del requisito cuando aplica (ej. DA_D22, DA_D23 para directrices de acreditación INN)',
    });
    await queryInterface.addIndex('checklist_template_items', ['norma']);

    await queryInterface.addColumn('audit_checklist_items', 'norma', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ISO17025',
    });
    await queryInterface.addColumn('audit_checklist_items', 'fuente', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('internal_audits', 'norma', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'ISO17025',
      comment: 'ISO17025 | ISO17020 — norma bajo la cual se planifica esta auditoría',
    });
    await queryInterface.addIndex('internal_audits', ['norma']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('internal_audits', ['norma']);
    await queryInterface.removeColumn('internal_audits', 'norma');
    await queryInterface.removeColumn('audit_checklist_items', 'fuente');
    await queryInterface.removeColumn('audit_checklist_items', 'norma');
    await queryInterface.removeIndex('checklist_template_items', ['norma']);
    await queryInterface.removeColumn('checklist_template_items', 'fuente');
    await queryInterface.removeColumn('checklist_template_items', 'norma');
  },
};
