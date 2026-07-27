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
    quote_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Cotización de origen, si la OT se creó a partir de una',
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
        'lista_para_facturar',
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
    facturada_externamente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_facturacion_externa: {
      type: DataTypes.DATEONLY,
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
  WorkOrder.generarCodigo = async function (options = {}) {
    const CorrelativeService = require('../services/CorrelativeService');
    return CorrelativeService.next('orden_trabajo', options);
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
    WorkOrder.belongsTo(models.Quote, {
      foreignKey: 'quote_id',
      as: 'cotizacion',
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
