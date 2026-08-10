module.exports = (sequelize, DataTypes) => {
  const InternalAudit = sequelize.define('InternalAudit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código correlativo (AI-2026-001)',
    },
    norma: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ISO17025',
      comment: 'ISO17025 | ISO17020 — norma bajo la cual se planifica esta auditoría',
    },
    alcance: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Áreas, procesos o cláusulas cubiertas (ISO 17025 8.8.2)',
    },
    criterios: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Criterios de auditoría (norma, procedimientos internos)',
    },
    auditor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Auditor interno (usuario del sistema)',
    },
    auditor_externo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nombre del auditor externo contratado, si aplica',
    },
    fecha_planificada: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_realizacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('planificada', 'en_curso', 'completada', 'cancelada'),
      allowNull: false,
      defaultValue: 'planificada',
    },
    conclusiones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Conclusiones al cierre de la auditoría',
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'internal_audits',
    timestamps: true,
  });

  // Código correlativo del año: AI-2026-001
  InternalAudit.generarCodigo = async function () {
    const year = new Date().getFullYear();
    const { Op } = require('sequelize');
    const count = await InternalAudit.count({
      where: { codigo: { [Op.like]: `AI-${year}-%` } },
    });
    return `AI-${year}-${String(count + 1).padStart(3, '0')}`;
  };

  InternalAudit.associate = (models) => {
    InternalAudit.belongsTo(models.User, {
      foreignKey: 'auditor_id',
      as: 'auditor',
    });
    InternalAudit.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
    InternalAudit.hasMany(models.AuditFinding, {
      foreignKey: 'audit_id',
      as: 'hallazgos',
    });
    InternalAudit.hasMany(models.AuditChecklistItem, {
      foreignKey: 'audit_id',
      as: 'checklist',
      onDelete: 'CASCADE',
    });
  };

  return InternalAudit;
};
