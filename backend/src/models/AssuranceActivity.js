// Aseguramiento de la validez de los resultados (NCh-ISO/IEC 17025 §7.7).
// Cubre las cuatro piezas del apartado: la actividad en sí, su programación,
// el método con que se evalúa su conformidad y los registros que la respaldan.
module.exports = (sequelize, DataTypes) => {
  const AssuranceActivity = sequelize.define('AssuranceActivity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    tipo: {
      type: DataTypes.ENUM(
        'control_patron',
        'repetibilidad',
        'carta_control',
        'verificacion_intermedia',
        'recalibracion_item',
        'ensayo_aptitud',
        'intercomparacion',
        'revision_resultados',
        'correlacion_resultados',
        'auditoria_tecnica',
        'testificacion'
      ),
      allowNull: false,
    },
    magnitud: { type: DataTypes.STRING, allowNull: true },
    alcance: { type: DataTypes.TEXT, allowNull: false },
    equipment_id: { type: DataTypes.UUID, allowNull: true },
    responsable_id: { type: DataTypes.UUID, allowNull: true },

    // Programación
    frecuencia: {
      type: DataTypes.ENUM('unica', 'mensual', 'trimestral', 'semestral', 'anual', 'bienal'),
      allowNull: false,
      defaultValue: 'unica',
    },
    fecha_planificada: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_ejecucion: { type: DataTypes.DATEONLY, allowNull: true },
    estado: {
      type: DataTypes.ENUM('planificada', 'en_ejecucion', 'ejecutada', 'cancelada'),
      allowNull: false,
      defaultValue: 'planificada',
    },

    // Método para evaluar conformidad
    criterio: {
      type: DataTypes.ENUM('numero_en', 'emp', 'carta_control', 'z_score', 'otro'),
      allowNull: false,
      defaultValue: 'otro',
    },
    criterio_detalle: { type: DataTypes.TEXT, allowNull: true },
    valor_obtenido: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    valor_limite: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    resultado: {
      type: DataTypes.ENUM('pendiente', 'conforme', 'no_conforme', 'no_concluyente'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    evaluacion: { type: DataTypes.TEXT, allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },

    nonconformity_id: { type: DataTypes.UUID, allowNull: true },
    creado_por: { type: DataTypes.UUID, allowNull: false },
  }, {
    tableName: 'assurance_activities',
    timestamps: true,
  });

  AssuranceActivity.associate = (models) => {
    AssuranceActivity.belongsTo(models.User, { foreignKey: 'responsable_id', as: 'responsable' });
    AssuranceActivity.belongsTo(models.User, { foreignKey: 'creado_por', as: 'creador' });
    AssuranceActivity.belongsTo(models.Equipment, { foreignKey: 'equipment_id', as: 'equipo' });
    AssuranceActivity.belongsTo(models.NonConformity, { foreignKey: 'nonconformity_id', as: 'no_conformidad' });
    AssuranceActivity.hasMany(models.AssuranceRecord, {
      foreignKey: 'assurance_activity_id',
      as: 'registros',
    });
  };

  return AssuranceActivity;
};
