module.exports = (sequelize, DataTypes) => {
  const QuoteItem = sequelize.define('QuoteItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cotizacion_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    instrumento_cliente_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tarifa_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo_instrumento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    protocolo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    acreditado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'quote_items',
    timestamps: true,
  });

  QuoteItem.associate = (models) => {
    QuoteItem.belongsTo(models.Quote, {
      foreignKey: 'cotizacion_id',
      as: 'cotizacion',
    });
    QuoteItem.belongsTo(models.ClientInstrument, {
      foreignKey: 'instrumento_cliente_id',
      as: 'instrumento',
    });
    QuoteItem.belongsTo(models.PriceListItem, {
      foreignKey: 'tarifa_id',
      as: 'tarifa',
    });
  };

  return QuoteItem;
};
