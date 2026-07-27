'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('work_order_items', 'incertidumbre_U', {
      type: Sequelize.DECIMAL(14, 6),
      allowNull: true,
      comment: 'Incertidumbre expandida U',
    });
    await queryInterface.addColumn('work_order_items', 'factor_k', {
      type: Sequelize.DECIMAL(6, 3),
      allowNull: true,
      comment: 'Factor de cobertura k',
    });
    await queryInterface.addColumn('work_order_items', 'puntos', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Resultados finales digitados por punto de medición (estructura libre, sin JSON Schema formal aún)',
    });
    // Sin `comment` aquí: sequelize-cli falla con un error de SQL ("cadena de
    // caracteres entre comillas inconclusa") al combinar creación de un ENUM
    // nuevo vía addColumn + comment en este runner. La documentación del
    // campo queda en el modelo (WorkOrderItem.js) en su lugar.
    await queryInterface.addColumn('work_order_items', 'fuente_datos', {
      type: Sequelize.ENUM('digitacion', 'excel_adjunto'),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('work_order_items', 'fuente_datos');
    await queryInterface.removeColumn('work_order_items', 'puntos');
    await queryInterface.removeColumn('work_order_items', 'factor_k');
    await queryInterface.removeColumn('work_order_items', 'incertidumbre_U');
  },
};
