module.exports = (sequelize, DataTypes) => {
  const EquipmentEvent = sequelize.define('EquipmentEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM(
        'calibracion',
        'mantenimiento',
        'verificacion_intermedia'
      ),
      allowNull: false,
      comment: 'Calibración (6.4/6.5), mantenimiento o verificación intermedia (6.4.10)',
    },
    fecha_realizacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Quién ejecutó: proveedor externo o personal interno',
    },
    certificado_numero: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Número del certificado de calibración',
    },
    trazabilidad: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Patrón utilizado y cadena de trazabilidad al SI (6.5)',
    },
    resultado: {
      type: DataTypes.ENUM('conforme', 'no_conforme'),
      allowNull: true,
      comment: 'Un resultado no conforme genera NC automática (6.4.9)',
    },
    proxima_fecha: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Próxima fecha programada para este tipo de evento',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'equipment_events',
    timestamps: true,
  });

  EquipmentEvent.associate = (models) => {
    EquipmentEvent.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipo',
    });
    EquipmentEvent.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
  };

  return EquipmentEvent;
};
