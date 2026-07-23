module.exports = (sequelize, DataTypes) => {
  const DocumentAttachment = sequelize.define('DocumentAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    document_id: {
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
    tableName: 'document_attachments',
    timestamps: true,
  });

  DocumentAttachment.associate = (models) => {
    DocumentAttachment.belongsTo(models.Document, {
      foreignKey: 'document_id',
      as: 'documento',
    });
    DocumentAttachment.belongsTo(models.User, {
      foreignKey: 'subido_por',
      as: 'usuario',
    });
  };

  return DocumentAttachment;
};
