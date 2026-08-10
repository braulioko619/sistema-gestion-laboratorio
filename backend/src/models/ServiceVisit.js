module.exports = (sequelize, DataTypes) => {
  const ServiceVisit = sequelize.define('ServiceVisit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    work_order_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tecnico_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    lugar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modalidad: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'terreno',
    },
    distancia_km: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
    tiempo_traslado_horas: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'programada',
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'service_visits',
    timestamps: true,
  });

  ServiceVisit.associate = (models) => {
    ServiceVisit.belongsTo(models.WorkOrder, {
      foreignKey: 'work_order_id',
      as: 'ordenTrabajo',
    });
    ServiceVisit.belongsTo(models.Client, {
      foreignKey: 'cliente_id',
      as: 'cliente',
    });
    ServiceVisit.belongsTo(models.User, {
      foreignKey: 'tecnico_id',
      as: 'tecnico',
    });
    ServiceVisit.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
  };

  return ServiceVisit;
};
