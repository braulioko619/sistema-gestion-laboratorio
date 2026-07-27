module.exports = (sequelize, DataTypes) => {
  const StabilityAlert = sequelize.define('StabilityAlert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.ENUM(
        'vencimiento_calibracion',
        'vencimiento_mantenimiento',
        'vencimiento_verificacion',
        'deriva',
        'incertidumbre_creciente'
      ),
      allowNull: false,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    punto_medicion: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    nivel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    primera_deteccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ultima_deteccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    resuelta_en: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    email_enviado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'stability_alerts',
    timestamps: true,
  });

  StabilityAlert.associate = (models) => {
    StabilityAlert.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipo',
    });
  };

  return StabilityAlert;
};
