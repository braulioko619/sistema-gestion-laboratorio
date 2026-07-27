'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('excel_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Ej: PLT-MASA-001',
      },
      nombre: { type: Sequelize.STRING, allowNull: false },
      magnitud: { type: Sequelize.STRING, allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      estado: {
        type: Sequelize.ENUM('borrador', 'vigente', 'obsoleta'),
        allowNull: false,
        defaultValue: 'borrador',
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

    await queryInterface.createTable('excel_template_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'excel_templates', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Ej: 2.3',
      },
      nombre_original: { type: Sequelize.STRING, allowNull: false },
      archivo_almacenado: { type: Sequelize.STRING, allowNull: false, unique: true },
      sha256: { type: Sequelize.STRING(64), allowNull: false },
      cambios: { type: Sequelize.TEXT, allowNull: true },
      vigente: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      subido_por: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      aprobado_por: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_aprobacion: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    await queryInterface.addIndex('excel_template_versions', ['template_id', 'version'], {
      unique: true,
      name: 'excel_template_versions_template_version_unique',
    });

    // Solo una versión vigente por plantilla: índice único parcial (D3-style,
    // control a nivel de BD además del que hace el controlador en una
    // transacción al marcar vigente).
    await queryInterface.addIndex('excel_template_versions', ['template_id'], {
      unique: true,
      where: { vigente: true },
      name: 'excel_template_versions_una_vigente_por_plantilla',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('excel_template_versions');
    await queryInterface.dropTable('excel_templates');
  },
};
