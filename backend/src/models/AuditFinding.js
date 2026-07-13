module.exports = (sequelize, DataTypes) => {
  const AuditFinding = sequelize.define('AuditFinding', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    audit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('no_conformidad', 'observacion', 'oportunidad_mejora'),
      allowNull: false,
      comment: 'Un hallazgo tipo no_conformidad genera NC automática vinculada',
    },
    clausula: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Punto normativo afectado (ej: 6.4.3, 7.5.1)',
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    non_conformity_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'NC generada por este hallazgo, si aplica',
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'audit_findings',
    timestamps: true,
  });

  AuditFinding.associate = (models) => {
    AuditFinding.belongsTo(models.InternalAudit, {
      foreignKey: 'audit_id',
      as: 'auditoria',
    });
    AuditFinding.belongsTo(models.NonConformity, {
      foreignKey: 'non_conformity_id',
      as: 'no_conformidad',
    });
    AuditFinding.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
  };

  return AuditFinding;
};
