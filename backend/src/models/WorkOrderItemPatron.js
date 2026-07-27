module.exports = (sequelize, DataTypes) => {
  const WorkOrderItemPatron = sequelize.define('WorkOrderItemPatron', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    work_order_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    agregado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'work_order_item_patrones',
    timestamps: true,
  });

  WorkOrderItemPatron.associate = (models) => {
    WorkOrderItemPatron.belongsTo(models.WorkOrderItem, {
      foreignKey: 'work_order_item_id',
      as: 'item',
    });
    WorkOrderItemPatron.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'patron',
    });
    WorkOrderItemPatron.belongsTo(models.User, {
      foreignKey: 'agregado_por',
      as: 'agregadoPor',
    });
  };

  return WorkOrderItemPatron;
};
