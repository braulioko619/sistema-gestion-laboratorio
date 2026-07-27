module.exports = (sequelize, DataTypes) => {
  const ProcedureAuthorization = sequelize.define('ProcedureAuthorization', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Persona autorizada a ejecutar el procedimiento descrito en el documento',
    },
    autorizado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    alcance: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    magnitud: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('autorizado', 'revocado'),
      allowNull: false,
      defaultValue: 'autorizado',
    },
    fecha_autorizacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'procedure_authorizations',
    timestamps: true,
  });

  ProcedureAuthorization.associate = (models) => {
    ProcedureAuthorization.belongsTo(models.Document, {
      foreignKey: 'document_id',
      as: 'documento',
    });
    ProcedureAuthorization.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'usuario',
    });
    ProcedureAuthorization.belongsTo(models.User, {
      foreignKey: 'autorizado_por',
      as: 'otorgante',
    });
  };

  return ProcedureAuthorization;
};
