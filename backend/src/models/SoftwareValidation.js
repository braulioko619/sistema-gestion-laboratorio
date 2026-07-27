module.exports = (sequelize, DataTypes) => {
  const SoftwareValidation = sequelize.define('SoftwareValidation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    modulo: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Módulo/tarea validada, ej: "Etapa 0 / 0.1 - Correlativos"',
    },
    version_sistema: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    protocolo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    resultado: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    archivo_evidencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ejecutado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    aprobado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  }, {
    tableName: 'software_validations',
    timestamps: true,
  });

  SoftwareValidation.associate = (models) => {
    SoftwareValidation.belongsTo(models.User, {
      foreignKey: 'ejecutado_por',
      as: 'ejecutor',
    });
    SoftwareValidation.belongsTo(models.User, {
      foreignKey: 'aprobado_por',
      as: 'aprobador',
    });
  };

  return SoftwareValidation;
};
