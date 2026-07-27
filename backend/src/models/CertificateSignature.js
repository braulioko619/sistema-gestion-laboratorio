module.exports = (sequelize, DataTypes) => {
  const CertificateSignature = sequelize.define('CertificateSignature', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    certificate_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rol_firma: {
      type: DataTypes.ENUM('tecnico', 'supervisor', 'signatario_inn'),
      allowNull: false,
    },
    tipo_firma: {
      type: DataTypes.ENUM('simple', 'avanzada'),
      allowNull: false,
      defaultValue: 'simple',
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sha256_pdf_firmado: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    proveedor_fea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    evidencia_fea: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  }, {
    tableName: 'certificate_signatures',
    timestamps: true,
  });

  CertificateSignature.associate = (models) => {
    CertificateSignature.belongsTo(models.CalibrationCertificate, {
      foreignKey: 'certificate_id',
      as: 'certificado',
    });
    CertificateSignature.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'firmante',
    });
  };

  return CertificateSignature;
};
