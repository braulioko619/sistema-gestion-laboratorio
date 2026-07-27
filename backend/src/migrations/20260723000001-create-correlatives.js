'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('correlatives', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tipo: {
        type: Sequelize.ENUM('certificado', 'orden_trabajo', 'cotizacion'),
        allowNull: false,
      },
      anio: { type: Sequelize.INTEGER, allowNull: false },
      ultimo_numero: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('correlatives', ['tipo', 'anio'], {
      unique: true,
      name: 'correlatives_tipo_anio_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('correlatives');
  },
};
