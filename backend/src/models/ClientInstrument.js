module.exports = (sequelize, DataTypes) => {
  const ClientInstrument = sequelize.define('ClientInstrument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    codigo_interno: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código interno del laboratorio de calibraciones para el instrumento del cliente (no confundir con Equipment.codigo, que es equipo interno del laboratorio)',
    },
    codigo_cliente: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Código/etiqueta propio del cliente para identificar el instrumento',
    },
    tipo_instrumento: {
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
    rango_medida: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resolucion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unidad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proxima_fecha_calibracion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Alimenta las alertas de recalibración próxima/vencida',
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo', 'dado_de_baja'),
      allowNull: false,
      defaultValue: 'activo',
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'client_instruments',
    timestamps: true,
  });

  ClientInstrument.associate = (models) => {
    ClientInstrument.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    ClientInstrument.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    ClientInstrument.hasMany(models.WorkOrderItem, {
      foreignKey: 'instrumento_cliente_id',
      as: 'itemsOrden',
    });
  };

  return ClientInstrument;
};
