module.exports = (sequelize, DataTypes) => {
  const PersonnelRecord = sequelize.define('PersonnelRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM(
        'formacion_academica',
        'capacitacion',
        'experiencia',
        'evaluacion_competencia'
      ),
      allowNull: false,
      comment: 'Registros de competencia exigidos por ISO 17025 6.2.5',
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    institucion: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Institución educativa, proveedor de capacitación o empleador',
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Para capacitaciones o certificaciones con vigencia',
    },
    referencia_certificado: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resultado: {
      type: DataTypes.ENUM('aprobado', 'reprobado', 'pendiente'),
      allowNull: true,
      comment: 'Resultado de la evaluación de competencia o capacitación',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'personnel_records',
    timestamps: true,
  });

  PersonnelRecord.associate = (models) => {
    PersonnelRecord.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'persona',
    });
    PersonnelRecord.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
  };

  return PersonnelRecord;
};
