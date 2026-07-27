'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('calibration_certificates', 'acreditado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Heredado del work_order_item al crear el certificado; no editable después por API',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('calibration_certificates', 'acreditado');
  },
};
