module.exports = (sequelize, DataTypes) => {
  const QualityRecordAttachment = sequelize.define('QualityRecordAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    record_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_almacenado: {
      type: DataTypes.STRING,
      allowNull: false,
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
    subido_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'quality_record_attachments',
    timestamps: true,
  });

  QualityRecordAttachment.associate = (models) => {
    QualityRecordAttachment.belongsTo(models.QualityRecord, {
      foreignKey: 'record_id',
      as: 'registro',
    });
    QualityRecordAttachment.belongsTo(models.User, {
      foreignKey: 'subido_por',
      as: 'usuario',
    });
  };

  return QualityRecordAttachment;
};
