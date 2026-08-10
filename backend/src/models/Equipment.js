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
    rango: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resolucion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    magnitud: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    norma: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    protocolo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hoja_de_vida: {
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
    categoria: {
      type: DataTypes.ENUM('patron_calibracion', 'equipo_laboratorio'),
      allowNull: false,
      defaultValue: 'patron_calibracion',
      comment: 'patron_calibracion: patrón del laboratorio de calibraciones. equipo_laboratorio: equipo de ensayo de una sede (Control Metrológico)',
    },
    sede: {
      type: DataTypes.STRING,
      allowNull: true,
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
    error_maximo_permitido: {
      type: DataTypes.DECIMAL(14, 6),
      allowNull: true,
      comment: 'Tolerancia del patrón (EMP), en la misma unidad que sus puntos calibrados; usada por el análisis de deriva (tarea 3.4)',
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
    Equipment.belongsToMany(models.WorkOrderItem, {
      through: models.WorkOrderItemPatron,
      foreignKey: 'equipment_id',
      otherKey: 'work_order_item_id',
      as: 'calibracionesRealizadas',
    });
    Equipment.hasMany(models.StandardCalibrationHistory, {
      foreignKey: 'equipment_id',
      as: 'historialCalibraciones',
    });
    Equipment.hasMany(models.EquipmentImage, {
      foreignKey: 'equipment_id',
      as: 'imagenes',
    });
    Equipment.hasMany(models.EquipmentDocument, {
      foreignKey: 'equipment_id',
      as: 'documentos',
    });
    Equipment.hasMany(models.EquipmentLogEntry, {
      foreignKey: 'equipment_id',
      as: 'bitacora',
    });
  };

  return Equipment;
};
