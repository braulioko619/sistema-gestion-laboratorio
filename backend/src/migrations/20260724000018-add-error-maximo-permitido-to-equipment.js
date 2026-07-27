'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tolerancia del patrón (EMP), criterio (b) de D7: la deriva proyectada
    // (tarea 3.4) se compara contra este valor para decidir si alertar.
    await queryInterface.addColumn('equipment', 'error_maximo_permitido', {
      type: Sequelize.DECIMAL(14, 6),
      allowNull: true,
      comment: 'Tolerancia del patrón en la misma unidad que sus puntos calibrados; usada por el análisis de deriva (tarea 3.4)',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('equipment', 'error_maximo_permitido');
  },
};
