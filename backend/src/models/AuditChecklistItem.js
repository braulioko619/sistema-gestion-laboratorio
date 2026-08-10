module.exports = (sequelize, DataTypes) => {
  const AuditChecklistItem = sequelize.define('AuditChecklistItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    audit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    template_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    evaluacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    evidencia: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'audit_checklist_items',
    timestamps: true,
  });

  AuditChecklistItem.associate = (models) => {
    AuditChecklistItem.belongsTo(models.InternalAudit, {
      foreignKey: 'audit_id',
      as: 'auditoria',
    });
    AuditChecklistItem.belongsTo(models.ChecklistTemplateItem, {
      foreignKey: 'template_item_id',
      as: 'plantilla',
    });
  };

  return AuditChecklistItem;
};
