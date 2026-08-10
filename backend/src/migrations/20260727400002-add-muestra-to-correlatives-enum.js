'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_correlatives_tipo" ADD VALUE IF NOT EXISTS 'muestra';`
    );
  },

  // Postgres no permite quitar un valor de un ENUM directamente; revertir
  // esto requeriría recrear el tipo. Se deja como no-op intencional.
  down: async () => {},
};
