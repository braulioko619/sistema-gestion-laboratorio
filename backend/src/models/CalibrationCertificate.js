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
      type: DataTypes.ENUM('borrador', 'firmado', 'emitido', 'enviado', 'superseded'),
      allowNull: false,
      defaultValue: 'borrador',
    },
    acreditado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Heredado del work_order_item al crear el certificado; no editable después por API',
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
    decision_rule: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Regla de decisión de conformidad (ISO 17025 7.8.6)',
    },
    sha256_pdf: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    supersede_a_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Si este certificado es una enmienda, apunta al certificado que reemplaza (7.8.8)',
    },
    motivo_enmienda: {
      type: DataTypes.TEXT,
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
  CalibrationCertificate.generarCodigo = async function (options = {}) {
    const CorrelativeService = require('../services/CorrelativeService');
    return CorrelativeService.next('certificado', options);
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
    CalibrationCertificate.hasMany(models.CertificateSignature, {
      foreignKey: 'certificate_id',
      as: 'firmas',
    });
    // Cadena de enmiendas (tarea 2.9 / D4 / ISO 17025 7.8.8): la enmienda
    // apunta hacia atrás al certificado que reemplaza; el original expone
    // hacia adelante cuál lo reemplazó (si ya fue enmendado).
    CalibrationCertificate.belongsTo(models.CalibrationCertificate, {
      foreignKey: 'supersede_a_id',
      as: 'certificadoOriginal',
    });
    CalibrationCertificate.hasOne(models.CalibrationCertificate, {
      foreignKey: 'supersede_a_id',
      as: 'enmendadoPor',
    });
  };

  return CalibrationCertificate;
};
