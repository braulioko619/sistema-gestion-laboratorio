module.exports = (sequelize, DataTypes) => {
  const CommercialDocument = sequelize.define('CommercialDocument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    orden_trabajo_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    documento_relacionado_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM('orden_compra', 'factura', 'nota_credito'),
      allowNull: false,
    },
    numero: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha_emision: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    moneda: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CLP',
    },
    estado: {
      type: DataTypes.ENUM('vigente', 'anulado'),
      allowNull: false,
      defaultValue: 'vigente',
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nombre_almacenado: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    tipo_mime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tamano_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'client_commercial_documents',
    timestamps: true,
  });

  CommercialDocument.associate = (models) => {
    CommercialDocument.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    CommercialDocument.belongsTo(models.WorkOrder, {
      foreignKey: 'orden_trabajo_id',
      as: 'ordenTrabajo',
    });
    CommercialDocument.belongsTo(models.CommercialDocument, {
      foreignKey: 'documento_relacionado_id',
      as: 'documentoRelacionado',
    });
    CommercialDocument.hasMany(models.CommercialDocument, {
      foreignKey: 'documento_relacionado_id',
      as: 'documentosRelacionados',
    });
    CommercialDocument.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
  };

  return CommercialDocument;
};
