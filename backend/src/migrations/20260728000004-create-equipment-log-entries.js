'use strict';

// Bitácora de instrumento con control de cambio: tabla de solo
// creación/lectura desde la API (sin update/delete expuestos). Una
// corrección se registra como una fila nueva que referencia, vía
// corrige_entrada_id, a la entrada que corrige — nunca se edita ni se borra
// una entrada existente.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('equipment_log_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      tipo: {
        type: Sequelize.ENUM(
          'uso',
          'incidencia',
          'traslado',
          'mantenimiento_correctivo',
          'cambio_estado',
          'observacion',
          'correccion',
          'otro'
        ),
        allowNull: false,
      },
      descripcion: { type: Sequelize.TEXT, allowNull: false },
      estado_resultante: {
        type: Sequelize.ENUM('operativo', 'en_calibracion', 'en_mantenimiento', 'fuera_servicio', 'dado_de_baja'),
        allowNull: true,
        comment: 'Si se informa, refleja el estado del equipo tras este suceso de bitácora',
      },
      corrige_entrada_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'equipment_log_entries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      registrado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('equipment_log_entries', ['equipment_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('equipment_log_entries');
  },
};
