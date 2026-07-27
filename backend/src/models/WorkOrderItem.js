const { Op } = require('sequelize');

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
    acreditado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    incertidumbre_U: {
      type: DataTypes.DECIMAL(14, 6),
      allowNull: true,
      comment: 'Incertidumbre expandida U',
    },
    factor_k: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: true,
      comment: 'Factor de cobertura k',
    },
    puntos: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Resultados finales digitados por punto de medición (estructura libre)',
    },
    fuente_datos: {
      type: DataTypes.ENUM('digitacion', 'excel_adjunto'),
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
    // 'certificado' = el certificado ACTIVO del ítem (tarea 2.9): excluye
    // 'superseded' para que todo el código existente (generar/subir/firmar/
    // emitir, checks de "ya tiene certificado") siga viendo como único
    // resultado el certificado vigente, aunque exista una cadena de
    // enmiendas debajo. El historial completo, incluidas las filas
    // 'superseded', está en 'historialCertificados'.
    WorkOrderItem.hasOne(models.CalibrationCertificate, {
      foreignKey: 'orden_trabajo_item_id',
      as: 'certificado',
      scope: { estado: { [Op.ne]: 'superseded' } },
    });
    WorkOrderItem.hasMany(models.CalibrationCertificate, {
      foreignKey: 'orden_trabajo_item_id',
      as: 'historialCertificados',
    });
    WorkOrderItem.hasMany(models.CalibrationDataFile, {
      foreignKey: 'work_order_item_id',
      as: 'archivosDatos',
    });
    WorkOrderItem.hasMany(models.CalibrationFormEntry, {
      foreignKey: 'work_order_item_id',
      as: 'entradasFormulario',
    });
    WorkOrderItem.belongsToMany(models.Equipment, {
      through: models.WorkOrderItemPatron,
      foreignKey: 'work_order_item_id',
      otherKey: 'equipment_id',
      as: 'patrones',
    });
  };

  return WorkOrderItem;
};
