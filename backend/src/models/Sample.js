module.exports = (sequelize, DataTypes) => {
  const Sample = sequelize.define('Sample', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numero_muestra: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Correlativo único e irrepetible (MU-2026-001)',
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    instrumento_cliente_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tipo_instrumento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero_serie: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    condicion_recepcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_recepcion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pendiente',
    },
    work_order_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    work_order_item_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'samples',
    timestamps: true,
  });

  Sample.generarNumero = async function (options = {}) {
    const CorrelativeService = require('../services/CorrelativeService');
    return CorrelativeService.next('muestra', options);
  };

  Sample.associate = (models) => {
    Sample.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    Sample.belongsTo(models.ClientInstrument, {
      foreignKey: 'instrumento_cliente_id',
      as: 'instrumento',
    });
    Sample.belongsTo(models.WorkOrder, {
      foreignKey: 'work_order_id',
      as: 'ordenTrabajo',
    });
    Sample.belongsTo(models.WorkOrderItem, {
      foreignKey: 'work_order_item_id',
      as: 'itemOrden',
    });
    Sample.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
  };

  return Sample;
};
