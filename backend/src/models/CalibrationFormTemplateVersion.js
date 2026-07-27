module.exports = (sequelize, DataTypes) => {
  const CalibrationFormTemplateVersion = sequelize.define('CalibrationFormTemplateVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Ej: 1.0',
    },
    schema: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON Schema (draft-07) que define los campos del formulario',
    },
    cambios: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vigente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    aprobado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'calibration_form_template_versions',
    timestamps: true,
  });

  CalibrationFormTemplateVersion.associate = (models) => {
    CalibrationFormTemplateVersion.belongsTo(models.CalibrationFormTemplate, {
      foreignKey: 'template_id',
      as: 'plantilla',
    });
    CalibrationFormTemplateVersion.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'creadoPor',
    });
    CalibrationFormTemplateVersion.belongsTo(models.User, {
      foreignKey: 'aprobado_por',
      as: 'aprobadoPor',
    });
    CalibrationFormTemplateVersion.hasMany(models.CalibrationFormEntry, {
      foreignKey: 'form_template_version_id',
      as: 'entradas',
    });
  };

  return CalibrationFormTemplateVersion;
};
