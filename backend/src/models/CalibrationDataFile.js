module.exports = (sequelize, DataTypes) => {
  const CalibrationDataFile = sequelize.define('CalibrationDataFile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    work_order_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    template_version_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    archivo_almacenado: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    sha256: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    hash_verificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subido_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'calibration_data_files',
    timestamps: true,
  });

  CalibrationDataFile.associate = (models) => {
    CalibrationDataFile.belongsTo(models.WorkOrderItem, {
      foreignKey: 'work_order_item_id',
      as: 'item',
    });
    CalibrationDataFile.belongsTo(models.ExcelTemplateVersion, {
      foreignKey: 'template_version_id',
      as: 'versionPlantilla',
    });
    CalibrationDataFile.belongsTo(models.User, {
      foreignKey: 'subido_por',
      as: 'subidoPor',
    });
  };

  return CalibrationDataFile;
};
