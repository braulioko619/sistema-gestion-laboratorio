module.exports = (sequelize, DataTypes) => {
  const Quote = sequelize.define('Quote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'emitida', 'aceptada', 'rechazada', 'anulada'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    fecha_emision: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    validez_dias: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    moneda: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CLP',
    },
    descuento_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    iva_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 19,
    },
    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    descuento_monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    iva_monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    condiciones: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'quotes',
    timestamps: true,
  });

  Quote.generarCodigo = async function () {
    const year = new Date().getFullYear();
    const { Op } = require('sequelize');
    const count = await Quote.count({ where: { codigo: { [Op.like]: `COT-${year}-%` } } });
    const correlativo = String(count + 1).padStart(3, '0');
    return `COT-${year}-${correlativo}`;
  };

  Quote.associate = (models) => {
    Quote.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    Quote.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    Quote.hasMany(models.QuoteItem, {
      foreignKey: 'cotizacion_id',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return Quote;
};
