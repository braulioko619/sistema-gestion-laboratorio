module.exports = (sequelize, DataTypes) => {
  const ExcelTemplate = sequelize.define('ExcelTemplate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Ej: PLT-MASA-001',
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    magnitud: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'vigente', 'obsoleta'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'excel_templates',
    timestamps: true,
  });

  ExcelTemplate.associate = (models) => {
    ExcelTemplate.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    ExcelTemplate.hasMany(models.ExcelTemplateVersion, {
      foreignKey: 'template_id',
      as: 'versiones',
      onDelete: 'CASCADE',
    });
  };

  return ExcelTemplate;
};
