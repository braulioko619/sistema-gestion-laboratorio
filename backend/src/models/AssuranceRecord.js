// Registro (evidencia) de una actividad de aseguramiento. Sin borrado: es
// evidencia de auditoría; un archivo erróneo se reemplaza subiendo otro.
module.exports = (sequelize, DataTypes) => {
  const AssuranceRecord = sequelize.define('AssuranceRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assurance_activity_id: { type: DataTypes.UUID, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    nombre_original: { type: DataTypes.STRING, allowNull: false },
    nombre_almacenado: { type: DataTypes.STRING, allowNull: false, unique: true },
    tipo_mime: { type: DataTypes.STRING, allowNull: true },
    tamano_bytes: { type: DataTypes.INTEGER, allowNull: true },
    subido_por: { type: DataTypes.UUID, allowNull: false },
  }, {
    tableName: 'assurance_records',
    timestamps: true,
  });

  AssuranceRecord.associate = (models) => {
    AssuranceRecord.belongsTo(models.AssuranceActivity, {
      foreignKey: 'assurance_activity_id',
      as: 'actividad',
    });
    AssuranceRecord.belongsTo(models.User, { foreignKey: 'subido_por', as: 'usuario' });
  };

  return AssuranceRecord;
};
