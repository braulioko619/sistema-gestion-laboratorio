'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stability_alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tipo: {
        type: Sequelize.ENUM(
          'vencimiento_calibracion',
          'vencimiento_mantenimiento',
          'vencimiento_verificacion',
          'deriva',
          'incertidumbre_creciente'
        ),
        allowNull: false,
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Solo aplica a 'deriva'/'incertidumbre_creciente'; '' (no NULL, a
      // propósito) para 'vencimiento_*', porque un índice único con una
      // columna NULL no deduplica en Postgres (NULL <> NULL) y esta columna
      // es parte de la clave de deduplicación de abajo.
      punto_medicion: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      nivel: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Para alertas de vencimiento: '90', '60', '30' o 'vencido'. No aplica a deriva/incertidumbre.",
      },
      mensaje: { type: Sequelize.TEXT, allowNull: false },
      primera_deteccion: { type: Sequelize.DATEONLY, allowNull: false },
      ultima_deteccion: { type: Sequelize.DATEONLY, allowNull: false },
      resuelta_en: { type: Sequelize.DATEONLY, allowNull: true },
      email_enviado: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });

    // Como máximo una alerta ACTIVA (resuelta_en IS NULL) por
    // (tipo, equipment_id, punto_medicion) — mismo patrón D3 que "una sola
    // versión vigente" (2.1/3.1) y "un certificado activo por ítem" (2.9).
    // Es la base real de "no hay duplicados día a día": si el job diario
    // vuelve a detectar la misma condición sin resolver, actualiza la fila
    // existente (ultima_deteccion) en vez de crear una nueva ni reenviar el
    // email; solo se crea/emaila una fila nueva cuando la alerta anterior ya
    // se había marcado resuelta.
    await queryInterface.addIndex('stability_alerts', ['tipo', 'equipment_id', 'punto_medicion'], {
      unique: true,
      where: { resuelta_en: null },
      name: 'stability_alerts_una_activa_por_condicion',
    });

    await queryInterface.addIndex('stability_alerts', ['equipment_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('stability_alerts');
  },
};
