'use strict';

// 'aseguramiento' como tipo de correlativo (AS-2026-001) y como fuente de no
// conformidad, para que una NC nacida de una actividad de aseguramiento
// quede identificada como tal (§7.7.3).
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_correlatives_tipo" ADD VALUE IF NOT EXISTS 'aseguramiento';`
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_non_conformities_fuente" ADD VALUE IF NOT EXISTS 'aseguramiento';`
    );
  },

  // Postgres no permite quitar un valor de un ENUM directamente; revertirlo
  // exigiría recrear el tipo. No-op intencional, igual que en la migración
  // que agregó 'muestra'.
  down: async () => {},
};
