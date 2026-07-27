'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('calibration_form_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Ej: FORM-MASA-001',
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

    // Mismo patrón de dos tablas que excel_templates/excel_template_versions
    // (tarea 2.1): la plantilla es la identidad (código, magnitud), cada
    // versión es un JSON Schema inmutable propio. No es un archivo subido
    // (a diferencia de Excel), así que no hay sha256/archivo_almacenado —
    // el contenido versionado ES el propio `schema` JSONB, validado con ajv
    // antes de persistir (D2 / tarea 3.1).
    await queryInterface.createTable('calibration_form_template_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'calibration_form_templates', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Ej: 1.0',
      },
      schema: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'JSON Schema (draft-07) que define los campos del formulario; compilado con ajv antes de persistir',
      },
      cambios: { type: Sequelize.TEXT, allowNull: true },
      vigente: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      creado_por: {
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

    await queryInterface.addIndex('calibration_form_template_versions', ['template_id', 'version'], {
      unique: true,
      name: 'calibration_form_template_versions_template_version_unique',
    });

    // Solo una versión vigente por plantilla: índice único parcial (D3-style,
    // mismo patrón que excel_template_versions.vigente en la tarea 2.1).
    await queryInterface.addIndex('calibration_form_template_versions', ['template_id'], {
      unique: true,
      where: { vigente: true },
      name: 'calibration_form_template_versions_una_vigente_por_plantilla',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('calibration_form_template_versions');
    await queryInterface.dropTable('calibration_form_templates');
  },
};
