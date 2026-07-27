'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('calibration_data_files', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      work_order_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'work_order_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Sin restricción de unicidad: histórico append-only, re-subir crea fila nueva',
      },
      template_version_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'excel_template_versions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Nullable: raw data legado subido antes del gestor de plantillas, o captura manual sin plantilla',
      },
      nombre_original: { type: Sequelize.STRING, allowNull: false },
      archivo_almacenado: { type: Sequelize.STRING, allowNull: false, unique: true },
      sha256: { type: Sequelize.STRING(64), allowNull: false },
      hash_verificado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'true al subir (se computó del archivo recién guardado); una verificación posterior lo pone en false si el archivo en disco ya no calza con el hash registrado',
      },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      subido_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('calibration_data_files', ['work_order_item_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('calibration_data_files');
  },
};
