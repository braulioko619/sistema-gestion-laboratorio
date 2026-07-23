'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('accreditation_scopes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo_acreditacion: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Ej: OI 452 (número de acreditación INN)',
      },
      tipo_organismo: { type: Sequelize.STRING, allowNull: true },
      norma_acreditacion: { type: Sequelize.STRING, allowNull: true },
      area: { type: Sequelize.STRING, allowNull: true },
      subarea: { type: Sequelize.STRING, allowNull: true },
      item: { type: Sequelize.TEXT, allowNull: true },
      esquema: { type: Sequelize.STRING, allowNull: true },
      normas_aplicables: { type: Sequelize.TEXT, allowNull: true },
      alcance_ensayo: { type: Sequelize.TEXT, allowNull: true },
      modelo_certificacion: { type: Sequelize.STRING, allowNull: true },
      vigencia_desde: { type: Sequelize.DATEONLY, allowNull: true },
      vigencia_hasta: { type: Sequelize.DATEONLY, allowNull: true },
      fuente_documento: { type: Sequelize.STRING, allowNull: true },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('accreditation_scopes', ['codigo_acreditacion']);
    await queryInterface.addIndex('accreditation_scopes', ['area']);
    await queryInterface.addIndex('accreditation_scopes', ['activo']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('accreditation_scopes');
  },
};
