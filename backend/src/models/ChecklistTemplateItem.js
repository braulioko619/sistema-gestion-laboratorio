module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplateItem = sequelize.define('ChecklistTemplateItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'item',
    },
    clausula: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    norma: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ISO17025',
    },
    fuente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vigente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'checklist_template_items',
    timestamps: true,
  });

  ChecklistTemplateItem.associate = (models) => {
    ChecklistTemplateItem.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    ChecklistTemplateItem.hasMany(models.AuditChecklistItem, {
      foreignKey: 'template_item_id',
      as: 'usosEnAuditorias',
    });
  };

  return ChecklistTemplateItem;
};
