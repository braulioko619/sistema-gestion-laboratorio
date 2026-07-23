module.exports = (sequelize, DataTypes) => {
  const WorkOrderItem = sequelize.define('WorkOrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orden_trabajo_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    instrumento_cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'calibrado', 'rechazado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    condicion_recepcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Condición del instrumento al momento de recibirlo',
    },
    resultado: {
      type: DataTypes.ENUM('conforme', 'no_conforme'),
      allowNull: true,
      comment: 'Resultado de la calibración; nulo hasta que se calibre',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'work_order_items',
    timestamps: true,
  });

  WorkOrderItem.associate = (models) => {
    WorkOrderItem.belongsTo(models.WorkOrder, {
      foreignKey: 'orden_trabajo_id',
      as: 'ordenTrabajo',
    });
    WorkOrderItem.belongsTo(models.ClientInstrument, {
      foreignKey: 'instrumento_cliente_id',
      as: 'instrumento',
    });
    WorkOrderItem.hasOne(models.CalibrationCertificate, {
      foreignKey: 'orden_trabajo_item_id',
      as: 'certificado',
    });
  };

  return WorkOrderItem;
};
