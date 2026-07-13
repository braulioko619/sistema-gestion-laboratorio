module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define('Equipment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código interno del laboratorio (etiqueta física)',
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero_serie: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    responsable_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(
        'operativo',
        'en_calibracion',
        'en_mantenimiento',
        'fuera_servicio',
        'dado_de_baja'
      ),
      allowNull: false,
      defaultValue: 'operativo',
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    proxima_calibracion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Se actualiza automáticamente al registrar una calibración',
    },
    proximo_mantenimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    proxima_verificacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    tableName: 'equipment',
    timestamps: true,
  });

  Equipment.associate = (models) => {
    Equipment.belongsTo(models.User, {
      foreignKey: 'responsable_id',
      as: 'responsable',
    });
    Equipment.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
    Equipment.hasMany(models.EquipmentEvent, {
      foreignKey: 'equipment_id',
      as: 'eventos',
    });
  };

  return Equipment;
};
