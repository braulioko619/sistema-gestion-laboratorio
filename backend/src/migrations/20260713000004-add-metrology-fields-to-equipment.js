'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('equipment', 'rango', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('equipment', 'resolucion', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('equipment', 'magnitud', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('equipment', 'norma', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('equipment', 'protocolo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('equipment', 'hoja_de_vida', { type: Sequelize.STRING, allowNull: true });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('equipment', 'rango');
    await queryInterface.removeColumn('equipment', 'resolucion');
    await queryInterface.removeColumn('equipment', 'magnitud');
    await queryInterface.removeColumn('equipment', 'norma');
    await queryInterface.removeColumn('equipment', 'protocolo');
    await queryInterface.removeColumn('equipment', 'hoja_de_vida');
  },
};
