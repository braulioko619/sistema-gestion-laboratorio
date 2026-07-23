module.exports = (sequelize, DataTypes) => {
  const ClientContact = sequelize.define('ClientContact', {
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
    nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cargo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    telefono: {
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
    tableName: 'client_contacts',
    timestamps: true,
  });

  ClientContact.associate = (models) => {
    ClientContact.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    ClientContact.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
  };

  return ClientContact;
};
