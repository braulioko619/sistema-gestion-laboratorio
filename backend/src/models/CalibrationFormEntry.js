module.exports = (sequelize, DataTypes) => {
  const CalibrationFormEntry = sequelize.define('CalibrationFormEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    work_order_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    form_template_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'confirmado'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    capturado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha_captura: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    confirmado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha_confirmacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'calibration_form_entries',
    timestamps: true,
  });

  CalibrationFormEntry.associate = (models) => {
    CalibrationFormEntry.belongsTo(models.WorkOrderItem, {
      foreignKey: 'work_order_item_id',
      as: 'item',
    });
    CalibrationFormEntry.belongsTo(models.CalibrationFormTemplateVersion, {
      foreignKey: 'form_template_version_id',
      as: 'versionPlantilla',
    });
    CalibrationFormEntry.belongsTo(models.User, {
      foreignKey: 'capturado_por',
      as: 'capturadoPor',
    });
    CalibrationFormEntry.belongsTo(models.User, {
      foreignKey: 'confirmado_por',
      as: 'confirmadoPor',
    });
  };

  return CalibrationFormEntry;
};
