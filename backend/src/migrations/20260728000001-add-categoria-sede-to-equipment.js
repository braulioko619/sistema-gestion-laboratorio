'use strict';

// Discriminador para reutilizar el módulo de Equipos (hoja de vida, eventos,
// historial de calibración, deriva, carta de control) también para el
// equipamiento de ensayo de la sede Maipú ("Control Metrológico"), sin mezclarlo
// con los patrones de calibración ("Equipos Patrones" en /calibraciones).
// Default 'patron_calibracion' preserva el comportamiento de los equipos ya
// existentes.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('equipment', 'categoria', {
      type: Sequelize.ENUM('patron_calibracion', 'equipo_laboratorio'),
      allowNull: false,
      defaultValue: 'patron_calibracion',
    });

    await queryInterface.addColumn('equipment', 'sede', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex('equipment', ['categoria']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('equipment', ['categoria']);
    await queryInterface.removeColumn('equipment', 'sede');
    await queryInterface.removeColumn('equipment', 'categoria');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_equipment_categoria";');
  },
};
