module.exports = (sequelize, DataTypes) => {
  const QualityIndicator = sequelize.define('QualityIndicator', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo_indicador: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Identificador del indicador (ph_agua, temperatura_ambiente, etc)',
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre legible del indicador',
    },
    unidad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    limite_minimo: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    limite_maximo: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Permite retirar indicadores sin perder el historial',
    },
  }, {
    tableName: 'quality_indicators',
    timestamps: true,
  });

  return QualityIndicator;
};
