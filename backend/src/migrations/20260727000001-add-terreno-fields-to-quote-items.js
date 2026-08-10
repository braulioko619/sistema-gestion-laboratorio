'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('quote_items', 'modalidad', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'laboratorio',
      comment: 'laboratorio|terreno — indica si el servicio se realiza en las dependencias del laboratorio o en terreno (instalaciones del cliente)',
    });
    await queryInterface.addColumn('quote_items', 'precio_base', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Tarifa base del servicio, sin considerar traslado ni horas hombre en terreno',
    });
    await queryInterface.addColumn('quote_items', 'distancia_km', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Distancia estimada (ida y vuelta) usada para calcular el valor de traslado en terreno',
    });
    await queryInterface.addColumn('quote_items', 'tarifa_km', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Tarifa por kilómetro usada para estimar automáticamente el valor de traslado',
    });
    await queryInterface.addColumn('quote_items', 'valor_traslado', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Valor de traslado (normalmente distancia_km * tarifa_km, pero puede ajustarse manualmente)',
    });
    await queryInterface.addColumn('quote_items', 'tiempo_traslado_horas', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Horas de traslado (ida y vuelta) consideradas en el servicio en terreno',
    });
    await queryInterface.addColumn('quote_items', 'tarifa_hora_traslado', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Valor por hora de traslado',
    });
    await queryInterface.addColumn('quote_items', 'horas_hombre', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Horas hombre requeridas para ejecutar el servicio en terreno',
    });
    await queryInterface.addColumn('quote_items', 'tarifa_hora_hombre', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Valor por hora hombre en terreno',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('quote_items', 'tarifa_hora_hombre');
    await queryInterface.removeColumn('quote_items', 'horas_hombre');
    await queryInterface.removeColumn('quote_items', 'tarifa_hora_traslado');
    await queryInterface.removeColumn('quote_items', 'tiempo_traslado_horas');
    await queryInterface.removeColumn('quote_items', 'valor_traslado');
    await queryInterface.removeColumn('quote_items', 'tarifa_km');
    await queryInterface.removeColumn('quote_items', 'distancia_km');
    await queryInterface.removeColumn('quote_items', 'precio_base');
    await queryInterface.removeColumn('quote_items', 'modalidad');
  },
};
