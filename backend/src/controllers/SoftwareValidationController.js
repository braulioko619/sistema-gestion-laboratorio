const { SoftwareValidation, User, AuditLog } = require('../models');
const logger = require('../config/logger');

const VALIDATION_INCLUDES = [
  { model: User, as: 'ejecutor', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'aprobador', attributes: ['id', 'nombre', 'email'] },
];

// Registrar una validación de software (cláusula 7.11.2)
exports.createSoftwareValidation = async (req, res) => {
  try {
    const { modulo, version_sistema, protocolo, resultado, archivo_evidencia, fecha, aprobado_por } = req.body;

    if (!modulo || !version_sistema || !protocolo || !resultado) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Módulo, versión del sistema, protocolo y resultado son obligatorios',
        },
      });
    }

    const validacion = await SoftwareValidation.create({
      modulo,
      version_sistema,
      protocolo,
      resultado,
      archivo_evidencia: archivo_evidencia || null,
      fecha: fecha || new Date().toISOString().split('T')[0],
      ejecutado_por: req.user.id,
      aprobado_por: aprobado_por || null,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'software_validation',
      entidad_id: validacion.id,
      cambios_nuevos: { modulo, version_sistema },
      ip_address: req.ip,
    });

    logger.info(`[SOFTWARE_VALIDATIONS] Registro creado para "${modulo}" por ${req.user.email}`);

    const resultado_completo = await SoftwareValidation.findByPk(validacion.id, { include: VALIDATION_INCLUDES });
    res.status(201).json({ success: true, message: 'Validación registrada correctamente', data: resultado_completo });
  } catch (error) {
    logger.error(`[SOFTWARE_VALIDATIONS] Error creando validación: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_SOFTWARE_VALIDATION_ERROR', message: 'Error registrando la validación' },
    });
  }
};

// Listar validaciones registradas
exports.getSoftwareValidations = async (req, res) => {
  try {
    const { modulo } = req.query;
    const where = {};
    if (modulo) where.modulo = modulo;

    const validaciones = await SoftwareValidation.findAll({
      where,
      include: VALIDATION_INCLUDES,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: validaciones });
  } catch (error) {
    logger.error(`[SOFTWARE_VALIDATIONS] Error listando validaciones: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_SOFTWARE_VALIDATIONS_ERROR', message: 'Error obteniendo las validaciones' },
    });
  }
};

// Detalle de una validación
exports.getSoftwareValidationById = async (req, res) => {
  try {
    const validacion = await SoftwareValidation.findByPk(req.params.id, { include: VALIDATION_INCLUDES });
    if (!validacion) {
      return res.status(404).json({
        success: false,
        error: { code: 'SOFTWARE_VALIDATION_NOT_FOUND', message: 'La validación no existe' },
      });
    }
    res.json({ success: true, data: validacion });
  } catch (error) {
    logger.error(`[SOFTWARE_VALIDATIONS] Error obteniendo validación: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_SOFTWARE_VALIDATION_ERROR', message: 'Error obteniendo la validación' },
    });
  }
};

// Aprobar una validación existente (registra quién la aprobó)
exports.approveSoftwareValidation = async (req, res) => {
  try {
    const validacion = await SoftwareValidation.findByPk(req.params.id);
    if (!validacion) {
      return res.status(404).json({
        success: false,
        error: { code: 'SOFTWARE_VALIDATION_NOT_FOUND', message: 'La validación no existe' },
      });
    }

    if (validacion.aprobado_por) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_APPROVED', message: 'Esta validación ya fue aprobada' },
      });
    }

    validacion.aprobado_por = req.user.id;
    await validacion.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'aprobar',
      entidad: 'software_validation',
      entidad_id: validacion.id,
      ip_address: req.ip,
    });

    logger.info(`[SOFTWARE_VALIDATIONS] Validación ${validacion.id} aprobada por ${req.user.email}`);

    const resultado_completo = await SoftwareValidation.findByPk(validacion.id, { include: VALIDATION_INCLUDES });
    res.json({ success: true, message: 'Validación aprobada correctamente', data: resultado_completo });
  } catch (error) {
    logger.error(`[SOFTWARE_VALIDATIONS] Error aprobando validación: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'APPROVE_SOFTWARE_VALIDATION_ERROR', message: 'Error aprobando la validación' },
    });
  }
};
