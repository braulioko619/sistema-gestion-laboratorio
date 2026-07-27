module.exports = (sequelize, DataTypes) => {
  const ExcelTemplateVersion = sequelize.define('ExcelTemplateVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Ej: 2.3',
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    archivo_almacenado: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    sha256: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    cambios: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vigente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    subido_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    aprobado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'excel_template_versions',
    timestamps: true,
  });

  ExcelTemplateVersion.associate = (models) => {
    ExcelTemplateVersion.belongsTo(models.ExcelTemplate, {
      foreignKey: 'template_id',
      as: 'plantilla',
    });
    ExcelTemplateVersion.belongsTo(models.User, {
      foreignKey: 'subido_por',
      as: 'subidoPor',
    });
    ExcelTemplateVersion.belongsTo(models.User, {
      foreignKey: 'aprobado_por',
      as: 'aprobadoPor',
    });
  };

  return ExcelTemplateVersion;
};
