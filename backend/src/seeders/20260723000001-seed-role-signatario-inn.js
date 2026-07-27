'use strict';

// Rol para quien firma certificados acreditados INN (Etapa 2, tarea 2.8).
// Por ahora solo existe el rol; no hay lógica de firma ni rutas que lo
// exijan todavía (eso es 2.7/2.8). `authorizeRole` ya acepta cualquier
// nombre de rol que se le pase, así que no requiere cambios de middleware.
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('roles', [
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        nombre: 'signatario_inn',
        descripcion: 'Firma certificados de calibración acreditados ante el INN',
        permisos: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('roles', { nombre: 'signatario_inn' }, {});
  },
};
