module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define('WorkOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código correlativo (OT-2026-001)',
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_compromiso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fecha_entrega: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(
        'recibida',
        'en_proceso',
        'calibrada',
        'certificado_emitido',
        'entregada',
        'cancelada'
      ),
      allowNull: false,
      defaultValue: 'recibida',
    },
    responsable_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Técnico asignado a la orden de trabajo',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'work_orders',
    timestamps: true,
  });

  // Genera el siguiente código correlativo del año en curso: OT-2026-001
  WorkOrder.generarCodigo = async function () {
    const year = new Date().getFullYear();
    const { Op } = require('sequelize');
    const count = await WorkOrder.count({
      where: {
        codigo: { [Op.like]: `OT-${year}-%` },
      },
    });
    const correlativo = String(count + 1).padStart(3, '0');
    return `OT-${year}-${correlativo}`;
  };

  WorkOrder.associate = (models) => {
    WorkOrder.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    WorkOrder.belongsTo(models.User, {
      foreignKey: 'responsable_id',
      as: 'responsable',
    });
    WorkOrder.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
    WorkOrder.hasMany(models.WorkOrderItem, {
      foreignKey: 'orden_trabajo_id',
      as: 'items',
    });
  };

  return WorkOrder;
};
