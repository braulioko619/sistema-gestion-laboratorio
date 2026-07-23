module.exports = (sequelize, DataTypes) => {
  const CalibrationCertificate = sequelize.define('CalibrationCertificate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código correlativo (CERT-2026-001)',
    },
    orden_trabajo_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      comment: 'Relación 1:1 - un certificado por instrumento calibrado en una orden',
    },
    fecha_emision: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    fecha_calibracion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'firmado', 'emitido', 'enviado'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nombre_almacenado: {
      type: DataTypes.STRING,
      allowNull: true,
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
    enviado_a: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Snapshot del correo al que se envió el certificado',
    },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estado_envio: {
      type: DataTypes.ENUM('pendiente', 'enviado', 'fallido'),
      allowNull: true,
    },
    creado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'calibration_certificates',
    timestamps: true,
  });

  // Genera el siguiente código correlativo del año en curso: CERT-2026-001
  CalibrationCertificate.generarCodigo = async function () {
    const year = new Date().getFullYear();
    const { Op } = require('sequelize');
    const count = await CalibrationCertificate.count({
      where: {
        codigo: { [Op.like]: `CERT-${year}-%` },
      },
    });
    const correlativo = String(count + 1).padStart(3, '0');
    return `CERT-${year}-${correlativo}`;
  };

  CalibrationCertificate.associate = (models) => {
    CalibrationCertificate.belongsTo(models.WorkOrderItem, {
      foreignKey: 'orden_trabajo_item_id',
      as: 'item',
    });
    CalibrationCertificate.belongsTo(models.User, {
      foreignKey: 'creado_por',
      as: 'registrador',
    });
  };

  return CalibrationCertificate;
};
