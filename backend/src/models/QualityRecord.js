const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const QualityRecord = sequelize.define('QualityRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo_indicador: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tipo de indicador (ph_agua, temperatura, etc)',
    },
    valor: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Valor del indicador',
    },
    unidad: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unidad de medida',
    },
    limite_minimo: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    limite_maximo: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    estado_cumplimiento: {
      type: DataTypes.ENUM('conforme', 'no_conforme', 'alerta'),
      defaultValue: 'conforme',
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'quality_records',
    timestamps: true,
  });

  QualityRecord.associate = (models) => {
    QualityRecord.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
  };

  return QualityRecord;
};
