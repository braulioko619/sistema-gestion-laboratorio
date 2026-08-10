module.exports = (sequelize, DataTypes) => {
  const EquipmentLogEntry = sequelize.define('EquipmentLogEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM(
        'uso',
        'incidencia',
        'traslado',
        'mantenimiento_correctivo',
        'cambio_estado',
        'observacion',
        'correccion',
        'otro'
      ),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado_resultante: {
      type: DataTypes.ENUM('operativo', 'en_calibracion', 'en_mantenimiento', 'fuera_servicio', 'dado_de_baja'),
      allowNull: true,
    },
    corrige_entrada_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Si se informa, esta entrada es una corrección de una entrada previa (bitácora inmutable / control de cambio)',
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'equipment_log_entries',
    timestamps: true,
  });

  EquipmentLogEntry.associate = (models) => {
    EquipmentLogEntry.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipo',
    });
    EquipmentLogEntry.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
    EquipmentLogEntry.belongsTo(models.EquipmentLogEntry, {
      foreignKey: 'corrige_entrada_id',
      as: 'entradaCorregida',
    });
    EquipmentLogEntry.hasMany(models.EquipmentLogEntry, {
      foreignKey: 'corrige_entrada_id',
      as: 'correcciones',
    });
  };

  return EquipmentLogEntry;
};
