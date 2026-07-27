'use strict';

// fecha_vencimiento ya existe en ambas tablas (confirmado leyendo los modelos
// reales antes de migrar, como pide el documento) — solo falta magnitud.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('personnel_authorizations', 'magnitud', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Magnitud metrológica autorizada (ej: Masa, Presión); nullable para autorizaciones legado sin magnitud asociada',
    });
    await queryInterface.addColumn('procedure_authorizations', 'magnitud', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('procedure_authorizations', 'magnitud');
    await queryInterface.removeColumn('personnel_authorizations', 'magnitud');
  },
};
