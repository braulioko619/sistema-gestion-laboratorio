module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    identificacion_fiscal: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'RUC/NIT/identificación fiscal del cliente',
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contacto_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nombre de la persona de contacto para este cliente',
    },
    email_contacto: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Correo al que se envían los certificados de calibración emitidos',
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo'),
      allowNull: false,
      defaultValue: 'activo',
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'clients',
    timestamps: true,
  });

  Client.associate = (models) => {
    Client.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    Client.hasMany(models.ClientInstrument, {
      foreignKey: 'cliente_id',
      as: 'instrumentos',
    });
    Client.hasMany(models.WorkOrder, {
      foreignKey: 'cliente_id',
      as: 'ordenesTrabajo',
    });
    Client.hasMany(models.ClientAddress, {
      foreignKey: 'cliente_id',
      as: 'direcciones',
      onDelete: 'CASCADE',
    });
    Client.hasMany(models.ClientContact, {
      foreignKey: 'cliente_id',
      as: 'contactos',
      onDelete: 'CASCADE',
    });
    Client.hasMany(models.CommercialDocument, {
      foreignKey: 'cliente_id',
      as: 'documentosComerciales',
    });
    Client.hasMany(models.Quote, {
      foreignKey: 'cliente_id',
      as: 'cotizaciones',
    });
  };

  return Client;
};
