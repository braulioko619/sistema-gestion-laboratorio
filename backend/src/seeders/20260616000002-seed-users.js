'use strict';

const { hashSeedPassword } = require('../utils/seedPassword');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminPassword = await hashSeedPassword(10);

    const users = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        email: 'admin@laboratorio.com',
        password: adminPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        role_id: '550e8400-e29b-41d4-a716-446655440001',
        estado: 'activo',
        ultimo_acceso: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        email: 'jefe@laboratorio.com',
        password: await hashSeedPassword(10),
        nombre: 'Juan',
        apellido: 'García',
        role_id: '550e8400-e29b-41d4-a716-446655440002',
        estado: 'activo',
        ultimo_acceso: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        email: 'supervisor@laboratorio.com',
        password: await hashSeedPassword(10),
        nombre: 'María',
        apellido: 'López',
        role_id: '550e8400-e29b-41d4-a716-446655440003',
        estado: 'activo',
        ultimo_acceso: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        email: 'calidad@laboratorio.com',
        password: await hashSeedPassword(10),
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        role_id: '550e8400-e29b-41d4-a716-446655440004',
        estado: 'activo',
        ultimo_acceso: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
