'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const qualityIndicators = [
      {
        id: '550e8400-e29b-41d4-a716-446655440100',
        tipo_indicador: 'ph_agua',
        nombre: 'pH del Agua Destilada',
        unidad: 'pH',
        limite_minimo: 6.5,
        limite_maximo: 7.5,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        tipo_indicador: 'temperatura_ambiente',
        nombre: 'Temperatura Ambiente del Laboratorio',
        unidad: '°C',
        limite_minimo: 18,
        limite_maximo: 25,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        tipo_indicador: 'humedad_relativa',
        nombre: 'Humedad Relativa del Ambiente',
        unidad: '%',
        limite_minimo: 30,
        limite_maximo: 70,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        tipo_indicador: 'conductividad_agua',
        nombre: 'Conductividad del Agua Destilada',
        unidad: 'µS/cm',
        limite_minimo: 0.1,
        limite_maximo: 5,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        tipo_indicador: 'presion_barometrica',
        nombre: 'Presión Barométrica',
        unidad: 'hPa',
        limite_minimo: 1000,
        limite_maximo: 1030,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440105',
        tipo_indicador: 'concentracion_cloro',
        nombre: 'Concentración de Cloro en Agua',
        unidad: 'mg/L',
        limite_minimo: 0.5,
        limite_maximo: 1.5,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440106',
        tipo_indicador: 'turbidez_agua',
        nombre: 'Turbidez del Agua',
        unidad: 'NTU',
        limite_minimo: 0,
        limite_maximo: 1,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440107',
        tipo_indicador: 'temperatura_refrigerador',
        nombre: 'Temperatura Interna del Refrigerador',
        unidad: '°C',
        limite_minimo: 2,
        limite_maximo: 8,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440108',
        tipo_indicador: 'temperatura_congelador',
        nombre: 'Temperatura Interna del Congelador',
        unidad: '°C',
        limite_minimo: -25,
        limite_maximo: -18,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440109',
        tipo_indicador: 'iluminacion_laboratorio',
        nombre: 'Nivel de Iluminación del Laboratorio',
        unidad: 'lux',
        limite_minimo: 500,
        limite_maximo: 1000,
      },
    ].map((ind) => ({
      ...ind,
      activo: true,
      createdAt: now,
      updatedAt: now,
    }));

    // ignoreDuplicates permite re-ejecutar el seeder sin conflictos de ID
    await queryInterface.bulkInsert('quality_indicators', qualityIndicators, {
      ignoreDuplicates: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('quality_indicators', null, {});
  },
};
