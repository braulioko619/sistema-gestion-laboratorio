'use strict';

const { Op } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('calibration_certificates', 'supersede_a_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'calibration_certificates', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: 'Si este certificado es una enmienda, apunta al certificado que reemplaza (7.8.8)',
    });
    await queryInterface.addColumn('calibration_certificates', 'motivo_enmienda', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // orden_trabajo_item_id ya no puede seguir siendo UNIQUE a secas: una
    // enmienda crea una segunda fila de certificado para el mismo ítem. Se
    // reemplaza la restricción única simple (creada en
    // 20260720000002-create-work-orders-and-certificates.js) por un índice
    // único parcial (mismo patrón D3 que
    // 20260724000006-create-excel-templates.js usa para "una sola versión
    // vigente"): como máximo un certificado NO superseded por ítem a la vez.
    await queryInterface.removeConstraint(
      'calibration_certificates',
      'calibration_certificates_orden_trabajo_item_id_key'
    );
    await queryInterface.addIndex('calibration_certificates', ['orden_trabajo_item_id'], {
      unique: true,
      where: { estado: { [Op.ne]: 'superseded' } },
      name: 'calibration_certificates_un_activo_por_item',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('calibration_certificates', 'calibration_certificates_un_activo_por_item');
    await queryInterface.addConstraint('calibration_certificates', {
      fields: ['orden_trabajo_item_id'],
      type: 'unique',
      name: 'calibration_certificates_orden_trabajo_item_id_key',
    });
    await queryInterface.removeColumn('calibration_certificates', 'motivo_enmienda');
    await queryInterface.removeColumn('calibration_certificates', 'supersede_a_id');
  },
};
