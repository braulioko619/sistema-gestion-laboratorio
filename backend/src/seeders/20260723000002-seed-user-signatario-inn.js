'use strict';

const bcrypt = require('bcryptjs');

// Usuario de prueba con el rol signatario_inn, siguiendo el mismo patrón que
// 20260616000002-seed-users.js (un usuario de ejemplo por rol para
// desarrollo/pruebas locales).
module.exports = {
  up: async (queryInterface) => {
    const password = await bcrypt.hash('Firmante@123', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        email: 'firmante@laboratorio.com',
        password,
        auth_provider: 'local',
        nombre: 'Firmante',
        apellido: 'INN',
        role_id: '550e8400-e29b-41d4-a716-446655440006',
        estado: 'activo',
        ultimo_acceso: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'firmante@laboratorio.com' }, {});
  },
};
