'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qualityIndicators = [
      {
        id: '550e8400-e29b-41d4-a716-446655440100',
        tipo_indicador: 'ph_agua',
        unidad: 'pH',
        limite_minimo: 6.5,
        limite_maximo: 7.5,
        descripcion: 'pH del Agua Destilada',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        tipo_indicador: 'temperatura_ambiente',
        unidad: '°C',
        limite_minimo: 18,
        limite_maximo: 25,
        descripcion: 'Temperatura Ambiente del Laboratorio',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        tipo_indicador: 'humedad_relativa',
        unidad: '%',
        limite_minimo: 30,
        limite_maximo: 70,
        descripcion: 'Humedad Relativa del Ambiente',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        tipo_indicador: 'conductividad_agua',
        unidad: 'µS/cm',
        limite_minimo: 0.1,
        limite_maximo: 5,
        descripcion: 'Conductividad del Agua Destilada',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        tipo_indicador: 'presion_barometrica',
        unidad: 'hPa',
        limite_minimo: 1000,
        limite_maximo: 1030,
        descripcion: 'Presión Barométrica',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440105',
        tipo_indicador: 'concentracion_cloro',
        unidad: 'mg/L',
        limite_minimo: 0.5,
        limite_maximo: 1.5,
        descripcion: 'Concentración de Cloro en Agua',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440106',
        tipo_indicador: 'turbidez_agua',
        unidad: 'NTU',
        limite_minimo: 0,
        limite_maximo: 1,
        descripcion: 'Turbidez del Agua',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440107',
        tipo_indicador: 'temperatura_refrigerador',
        unidad: '°C',
        limite_minimo: 2,
        limite_maximo: 8,
        descripcion: 'Temperatura Interna del Refrigerador',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440108',
        tipo_indicador: 'temperatura_congelador',
        unidad: '°C',
        limite_minimo: -25,
        limite_maximo: -18,
        descripcion: 'Temperatura Interna del Congelador',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440109',
        tipo_indicador: 'iluminacion_laboratorio',
        unidad: 'lux',
        limite_minimo: 500,
        limite_maximo: 1000,
        descripcion: 'Nivel de Iluminación del Laboratorio',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insertar en tabla temporal o comentario
    // En una versión real, crearíamos una tabla QualityIndicators
    console.log('Quality Indicators configurados:', qualityIndicators);
  },

  down: async (queryInterface, Sequelize) => {
    // No es necesario eliminar nada para este seeder
  },
};
