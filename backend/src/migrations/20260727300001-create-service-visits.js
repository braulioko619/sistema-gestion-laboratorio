'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('service_visits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      work_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      cliente_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tecnico_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin: { type: Sequelize.TIME, allowNull: true },
      lugar: { type: Sequelize.STRING, allowNull: true, comment: 'Dirección o lugar donde se presta el servicio' },
      modalidad: { type: Sequelize.STRING, allowNull: false, defaultValue: 'terreno' }, // 'terreno' | 'laboratorio'
      distancia_km: { type: Sequelize.DECIMAL(8, 2), allowNull: true, comment: 'Distancia estimada (ida y vuelta) para planificar el traslado' },
      tiempo_traslado_horas: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      motivo: { type: Sequelize.STRING, allowNull: true, comment: 'Descripción libre cuando el servicio aún no tiene una OT asociada' },
      comentarios: { type: Sequelize.TEXT, allowNull: true },
      estado: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'programada', // 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada'
      },
      creado_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('service_visits', ['fecha']);
    await queryInterface.addIndex('service_visits', ['tecnico_id']);
    await queryInterface.addIndex('service_visits', ['work_order_id']);
    await queryInterface.addIndex('service_visits', ['estado']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('service_visits');
  },
};
