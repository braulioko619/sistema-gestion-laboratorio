module.exports = (sequelize, DataTypes) => {
  const PriceListItem = sequelize.define('PriceListItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo_instrumento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    protocolo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rango_aplicable: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    moneda: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CLP',
    },
    vigente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'price_list_items',
    timestamps: true,
  });

  PriceListItem.associate = (models) => {
    PriceListItem.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    PriceListItem.hasMany(models.QuoteItem, {
      foreignKey: 'tarifa_id',
      as: 'itemsCotizados',
    });
  };

  return PriceListItem;
};
