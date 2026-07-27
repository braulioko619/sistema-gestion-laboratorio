module.exports = (sequelize, DataTypes) => {
  const StandardCalibrationHistory = sequelize.define('StandardCalibrationHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha_calibracion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('interna', 'externa'),
      allowNull: false,
    },
    laboratorio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certificado_numero: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certificado_archivo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certificado_sha256: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    punto_medicion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    valor_nominal: {
      type: DataTypes.DECIMAL(14, 6),
      allowNull: true,
    },
    valor_certificado: {
      type: DataTypes.DECIMAL(14, 6),
      allowNull: false,
    },
    unidad: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    incertidumbre_U: {
      type: DataTypes.DECIMAL(14, 6),
      allowNull: false,
    },
    factor_k: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: false,
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'standard_calibration_history',
    timestamps: true,
  });

  StandardCalibrationHistory.associate = (models) => {
    StandardCalibrationHistory.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipo',
    });
    StandardCalibrationHistory.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
  };

  return StandardCalibrationHistory;
};
