module.exports = (sequelize, DataTypes) => {
  const EquipmentDocument = sequelize.define('EquipmentDocument', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.ENUM('manual', 'protocolo', 'ficha_tecnica', 'certificado_calibracion', 'otro'),
      allowNull: false,
      defaultValue: 'otro',
      comment: 'Documentación exigida por NCh-ISO/IEC 17025, SEC o ISP',
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_almacenado: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    tipo_mime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tamano_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subido_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // Revisión del documento: aprobado o rechazado por jefatura o calidad.
    estado_firma: {
      type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    firmado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    firmado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    comentario_firma: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Obligatorio al rechazar: motivo del rechazo',
    },
  }, {
    tableName: 'equipment_documents',
    timestamps: true,
  });

  EquipmentDocument.associate = (models) => {
    EquipmentDocument.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipo',
    });
    EquipmentDocument.belongsTo(models.User, {
      foreignKey: 'subido_por',
      as: 'usuario',
    });
    EquipmentDocument.belongsTo(models.User, {
      foreignKey: 'firmado_por',
      as: 'firmante',
    });
  };

  return EquipmentDocument;
};
