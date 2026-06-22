const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tipo_documento: {
      type: DataTypes.ENUM(
        'procedimiento',
        'politica',
        'formulario',
        'reporte',
        'instructivo',
        'otro'
      ),
      defaultValue: 'procedimiento',
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    version_actual: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'publicado', 'archivado'),
      defaultValue: 'borrador',
    },
    modificado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha_publicacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'documents',
    timestamps: true,
  });

  Document.associate = (models) => {
    Document.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'autor',
    });
    Document.hasMany(models.DocumentVersion, {
      foreignKey: 'document_id',
      as: 'versiones',
      onDelete: 'CASCADE',
    });
  };

  return Document;
};
