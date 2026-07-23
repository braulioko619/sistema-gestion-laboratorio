const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    accion: {
      type: DataTypes.ENUM(
        'crear',
        'actualizar',
        'eliminar',
        'ver',
        'descargar',
        'aprobar',
        'rechazar',
        'publicar',
        'archivar',
        'enviar',
        'iniciar_sesion'
      ),
      allowNull: false,
    },
    entidad: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tipo de entidad: document, quality_record, user, etc',
    },
    entidad_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de la entidad afectada',
    },
    cambios_anteriores: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    cambios_nuevos: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    detalles: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      // Con timestamps:false, createdAt:'timestamp' no basta para que Sequelize
      // registre el atributo por sí solo: sin esto la columna (que sí existe en
      // la BD, con default now()) queda fuera de todo SELECT y llega undefined
      // al frontend ("Invalid Date" en Auditoría y en cualquier historial).
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'audit_logs',
    timestamps: false,
    createdAt: 'timestamp',
    updatedAt: false,
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
    });
  };

  return AuditLog;
};
