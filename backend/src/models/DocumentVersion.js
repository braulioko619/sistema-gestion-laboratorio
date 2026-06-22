const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const DocumentVersion = sequelize.define('DocumentVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    version_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cambios_realizados: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción de cambios en esta versión',
    },
    autor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'document_versions',
    timestamps: true,
  });

  DocumentVersion.associate = (models) => {
    DocumentVersion.belongsTo(models.Document, {
      foreignKey: 'document_id',
      as: 'documento',
    });
    DocumentVersion.belongsTo(models.User, {
      foreignKey: 'autor_id',
      as: 'autor',
    });
  };

  return DocumentVersion;
};
