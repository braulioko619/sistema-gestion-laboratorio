'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('calibration_certificates', 'decision_rule', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Regla de decisión de conformidad (ISO 17025 7.8.6), aplica sobre todo a certificados acreditados',
    });
    await queryInterface.addColumn('calibration_certificates', 'sha256_pdf', {
      type: Sequelize.STRING(64),
      allowNull: true,
      comment: 'SHA-256 del PDF generado internamente (tarea 2.6); nulo para certificados subidos manualmente antes de esta tarea',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('calibration_certificates', 'sha256_pdf');
    await queryInterface.removeColumn('calibration_certificates', 'decision_rule');
  },
};
