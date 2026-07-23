module.exports = (sequelize, DataTypes) => {
  const AccreditationScope = sequelize.define('AccreditationScope', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo_acreditacion: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Ej: OI 452 (número de acreditación INN)',
    },
    tipo_organismo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    norma_acreditacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subarea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    item: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    esquema: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    normas_aplicables: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    alcance_ensayo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modelo_certificacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vigencia_desde: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    vigencia_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fuente_documento: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'accreditation_scopes',
    timestamps: true,
  });

  return AccreditationScope;
};
