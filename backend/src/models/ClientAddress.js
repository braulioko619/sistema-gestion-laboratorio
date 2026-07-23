module.exports = (sequelize, DataTypes) => {
  const ClientAddress = sequelize.define('ClientAddress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general',
    },
    etiqueta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ciudad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'client_addresses',
    timestamps: true,
  });

  ClientAddress.associate = (models) => {
    ClientAddress.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    ClientAddress.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
  };

  return ClientAddress;
};
