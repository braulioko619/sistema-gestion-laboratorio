'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Un registro por PUNTO calibrado (comentario de la sección 2 del plan):
    // una sola calibración externa que cubre 5 puntos produce 5 filas que
    // comparten fecha_calibracion/tipo/laboratorio/certificado_numero. Es
    // deliberadamente así (no un JSONB con un arreglo de puntos, como
    // work_order_items.puntos) porque la tarea 3.4 necesita poder agrupar y
    // hacer regresión por equipo+punto a través del tiempo — mucho más
    // simple con filas planas que parseando arreglos JSONB.
    await queryInterface.createTable('standard_calibration_history', {
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
        onDelete: 'RESTRICT',
      },
      fecha_calibracion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.ENUM('interna', 'externa'),
        allowNull: false,
      },
      laboratorio: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Laboratorio externo que emitió el certificado (nulo si tipo=interna)',
      },
      certificado_numero: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      certificado_archivo: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nombre de archivo almacenado, si se adjuntó el PDF del certificado del patrón',
      },
      certificado_sha256: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'D1: SHA-256 del certificado adjunto, si existe',
      },
      punto_medicion: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      valor_nominal: {
        type: Sequelize.DECIMAL(14, 6),
        allowNull: true,
      },
      valor_certificado: {
        type: Sequelize.DECIMAL(14, 6),
        allowNull: false,
      },
      unidad: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      incertidumbre_U: {
        type: Sequelize.DECIMAL(14, 6),
        allowNull: false,
      },
      factor_k: {
        type: Sequelize.DECIMAL(6, 3),
        allowNull: false,
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

    // Consulta principal (criterio de aceptación "historial consultable por
    // equipo y punto") y la que usará el análisis de deriva (tarea 3.4).
    await queryInterface.addIndex('standard_calibration_history', ['equipment_id', 'punto_medicion', 'fecha_calibracion']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('standard_calibration_history');
  },
};
