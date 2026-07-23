'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (!table.auth_provider) {
      await queryInterface.addColumn('users', 'auth_provider', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'local',
      });
    }
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn('users', 'auth_provider');
  },
};
