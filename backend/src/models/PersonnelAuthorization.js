module.exports = (sequelize, DataTypes) => {
  const PersonnelAuthorization = sequelize.define('PersonnelAuthorization', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    actividad: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Actividad o método autorizado (ISO 17025 6.2.6)',
    },
    magnitud: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Magnitud metrológica autorizada (ej: Masa, Presión)',
    },
    alcance: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Alcance o limitaciones de la autorización',
    },
    autorizado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha_autorizacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('vigente', 'vencida', 'revocada'),
      allowNull: false,
      defaultValue: 'vigente',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'personnel_authorizations',
    timestamps: true,
  });

  PersonnelAuthorization.associate = (models) => {
    PersonnelAuthorization.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'persona',
    });
    PersonnelAuthorization.belongsTo(models.User, {
      foreignKey: 'autorizado_por',
      as: 'autorizador',
    });
  };

  return PersonnelAuthorization;
};
