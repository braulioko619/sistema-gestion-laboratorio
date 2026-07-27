module.exports = (sequelize, DataTypes) => {
  const Correlative = sequelize.define('Correlative', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.ENUM('certificado', 'orden_trabajo', 'cotizacion'),
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ultimo_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'correlatives',
    timestamps: true,
  });

  return Correlative;
};
