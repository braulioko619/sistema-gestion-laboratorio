module.exports = (sequelize, DataTypes) => {
  const NonConformity = sequelize.define('NonConformity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Código correlativo (NC-2026-001)',
    },
    fuente: {
      type: DataTypes.ENUM(
        'registro_calidad',
        'auditoria_interna',
        'queja_cliente',
        'proveedor',
        'equipo',
        'otro'
      ),
      allowNull: false,
      defaultValue: 'otro',
      comment: 'Origen de la no conformidad (ISO 17025 7.10 / 8.7)',
    },
    quality_record_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Registro de calidad que originó la NC (si aplica)',
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descripción del hallazgo o trabajo no conforme',
    },
    clasificacion: {
      type: DataTypes.ENUM('menor', 'mayor', 'critica'),
      allowNull: false,
      defaultValue: 'menor',
    },
    correccion_inmediata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Acción inmediata tomada para contener el problema',
    },
    decision_trabajo: {
      type: DataTypes.ENUM(
        'continuar',
        'suspender',
        'repetir',
        'notificar_cliente'
      ),
      allowNull: true,
      comment: 'Decisión sobre el trabajo afectado (ISO 17025 7.10.1c)',
    },
    analisis_causa_raiz: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Análisis de causa raíz (ISO 17025 8.7.1b)',
    },
    accion_correctiva: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Acción correctiva definida',
    },
    responsable_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Usuario responsable de ejecutar la acción correctiva',
    },
    fecha_compromiso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha comprometida para implementar la acción',
    },
    verificacion_eficacia: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Evidencia de la verificación de eficacia (ISO 17025 8.7.1e)',
    },
    eficaz: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Resultado de la verificación de eficacia',
    },
    verificado_por: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fecha_verificacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(
        'abierta',
        'en_tratamiento',
        'en_verificacion',
        'cerrada'
      ),
      allowNull: false,
      defaultValue: 'abierta',
    },
    registrado_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'non_conformities',
    timestamps: true,
  });

  // Genera el siguiente código correlativo del año en curso: NC-2026-001
  NonConformity.generarCodigo = async function () {
    const year = new Date().getFullYear();
    const { Op } = require('sequelize');
    const count = await NonConformity.count({
      where: {
        codigo: { [Op.like]: `NC-${year}-%` },
      },
    });
    const correlativo = String(count + 1).padStart(3, '0');
    return `NC-${year}-${correlativo}`;
  };

  NonConformity.associate = (models) => {
    NonConformity.belongsTo(models.User, {
      foreignKey: 'registrado_por',
      as: 'registrador',
    });
    NonConformity.belongsTo(models.User, {
      foreignKey: 'responsable_id',
      as: 'responsable',
    });
    NonConformity.belongsTo(models.User, {
      foreignKey: 'verificado_por',
      as: 'verificador',
    });
    NonConformity.belongsTo(models.QualityRecord, {
      foreignKey: 'quality_record_id',
      as: 'registro_origen',
    });
  };

  return NonConformity;
};
