module.exports = (sequelize, DataTypes) => {
  const CalibrationFormTemplate = sequelize.define('CalibrationFormTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Ej: FORM-MASA-001',
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    magnitud: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'vigente', 'obsoleta'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'calibration_form_templates',
    timestamps: true,
  });

  CalibrationFormTemplate.associate = (models) => {
    CalibrationFormTemplate.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    CalibrationFormTemplate.hasMany(models.CalibrationFormTemplateVersion, {
      foreignKey: 'template_id',
      as: 'versiones',
      onDelete: 'CASCADE',
    });
  };

  return CalibrationFormTemplate;
};
