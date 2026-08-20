'use strict';

// Aseguramiento de la validez de los resultados (NCh-ISO/IEC 17025 §7.7).
// Una fila = una actividad programada, con su criterio de conformidad, su
// resultado y el vínculo a la no conformidad que haya originado (§7.7.3).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assurance_activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Código correlativo (AS-2026-001)',
      },
      tipo: {
        type: Sequelize.ENUM(
          // Internas de control (§7.7.1)
          'control_patron',
          'repetibilidad',
          'carta_control',
          'verificacion_intermedia',
          'recalibracion_item',
          // Externas / interlaboratorio (§7.7.2)
          'ensayo_aptitud',
          'intercomparacion',
          // Revisión de resultados
          'revision_resultados',
          'correlacion_resultados',
          // Auditoría técnica interna
          'auditoria_tecnica',
          'testificacion'
        ),
        allowNull: false,
        comment: 'Actividad de aseguramiento segun NCh-ISO/IEC 17025 7.7',
      },
      magnitud: { type: Sequelize.STRING, allowNull: true },
      alcance: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Qué se controla: instrumento, rango, método',
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Patrón o equipo involucrado, si aplica',
      },
      responsable_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // Programación de actividades
      frecuencia: {
        type: Sequelize.ENUM('unica', 'mensual', 'trimestral', 'semestral', 'anual', 'bienal'),
        allowNull: false,
        defaultValue: 'unica',
      },
      fecha_planificada: { type: Sequelize.DATEONLY, allowNull: false },
      fecha_ejecucion: { type: Sequelize.DATEONLY, allowNull: true },
      estado: {
        type: Sequelize.ENUM('planificada', 'en_ejecucion', 'ejecutada', 'cancelada'),
        allowNull: false,
        defaultValue: 'planificada',
      },

      // Método para evaluar la conformidad
      criterio: {
        type: Sequelize.ENUM('numero_en', 'emp', 'carta_control', 'z_score', 'otro'),
        allowNull: false,
        defaultValue: 'otro',
      },
      criterio_detalle: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Criterio escrito: |En| <= 1, EMP = +/-0,02 mm, +/-3 sigma, etc.',
      },
      valor_obtenido: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: true,
        comment: 'Valor calculado: En, z, error o desviación',
      },
      valor_limite: {
        type: Sequelize.DECIMAL(18, 6),
        allowNull: true,
        comment: 'Límite de aceptación contra el que se compara',
      },
      resultado: {
        type: Sequelize.ENUM('pendiente', 'conforme', 'no_conforme', 'no_concluyente'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      evaluacion: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Análisis de los datos y conclusión (§7.7.3)',
      },
      observaciones: { type: Sequelize.TEXT, allowNull: true },

      // §7.7.3: cuando el resultado queda fuera de criterio
      nonconformity_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'non_conformities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('assurance_activities', ['estado']);
    await queryInterface.addIndex('assurance_activities', ['resultado']);
    await queryInterface.addIndex('assurance_activities', ['fecha_planificada']);
    await queryInterface.addIndex('assurance_activities', ['tipo']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('assurance_activities');
    const tipos = [
      'enum_assurance_activities_tipo',
      'enum_assurance_activities_frecuencia',
      'enum_assurance_activities_estado',
      'enum_assurance_activities_criterio',
      'enum_assurance_activities_resultado',
    ];
    for (const tipo of tipos) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${tipo}";`);
    }
  },
};
