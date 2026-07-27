const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { ExcelTemplate, ExcelTemplateVersion, User, AuditLog, sequelize } = require('../models');
const { uploadDirectory } = require('../middleware/uploadExcelTemplate');
const logger = require('../config/logger');

const VERSION_INCLUDES = [
  { model: User, as: 'subidoPor', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'aprobadoPor', attributes: ['id', 'nombre', 'email'] },
];

const TEMPLATE_INCLUDES = [
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  {
    model: ExcelTemplateVersion,
    as: 'versiones',
    include: VERSION_INCLUDES,
  },
];

function sha256DeArchivo(rutaAbsoluta) {
  return crypto.createHash('sha256').update(fs.readFileSync(rutaAbsoluta)).digest('hex');
}

// Crear una plantilla (nace en borrador, sin versiones)
exports.createTemplate = async (req, res) => {
  try {
    const { codigo, nombre, magnitud, descripcion } = req.body;

    if (!codigo || !nombre || !magnitud) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Código, nombre y magnitud son obligatorios' },
      });
    }

    const existe = await ExcelTemplate.findOne({ where: { codigo } });
    if (existe) {
      return res.status(409).json({
        success: false,
        error: { code: 'TEMPLATE_CODE_EXISTS', message: `Ya existe una plantilla con el código ${codigo}` },
      });
    }

    const plantilla = await ExcelTemplate.create({
      codigo,
      nombre,
      magnitud,
      descripcion: descripcion || null,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'excel_template',
      entidad_id: plantilla.id,
      cambios_nuevos: { codigo, nombre, magnitud },
      ip_address: req.ip,
    });

    logger.info(`[EXCEL_TEMPLATES] Plantilla ${codigo} creada por ${req.user.email}`);

    res.status(201).json({ success: true, message: 'Plantilla registrada correctamente', data: plantilla });
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error creando plantilla: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_TEMPLATE_ERROR', message: 'Error registrando la plantilla' },
    });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const { magnitud, estado, search } = req.query;
    const where = {};
    if (magnitud) where.magnitud = magnitud;
    if (estado) where.estado = estado;
    if (search) {
      where[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { nombre: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const plantillas = await ExcelTemplate.findAll({
      where,
      include: TEMPLATE_INCLUDES,
      order: [['magnitud', 'ASC'], ['codigo', 'ASC']],
    });

    res.json({ success: true, data: plantillas });
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error listando plantillas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_TEMPLATES_ERROR', message: 'Error obteniendo las plantillas' },
    });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const plantilla = await ExcelTemplate.findByPk(req.params.id, { include: TEMPLATE_INCLUDES });
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    res.json({ success: true, data: plantilla });
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error obteniendo plantilla: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_TEMPLATE_ERROR', message: 'Error obteniendo la plantilla' },
    });
  }
};

// Sube una nueva versión (no queda vigente automáticamente: hay que
// marcarla vigente explícitamente, ver marcarVersionVigente).
exports.uploadVersion = async (req, res) => {
  try {
    const { version, cambios } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar el archivo Excel de la plantilla' },
      });
    }
    if (!version) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'La versión es obligatoria (ej: 2.3)' },
      });
    }

    const plantilla = await ExcelTemplate.findByPk(req.params.id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    if (plantilla.estado === 'obsoleta') {
      return res.status(400).json({
        success: false,
        error: { code: 'TEMPLATE_OBSOLETE', message: 'No se pueden subir versiones a una plantilla obsoleta' },
      });
    }

    const yaExiste = await ExcelTemplateVersion.findOne({ where: { template_id: plantilla.id, version } });
    if (yaExiste) {
      return res.status(409).json({
        success: false,
        error: { code: 'VERSION_EXISTS', message: `Ya existe la versión ${version} para esta plantilla` },
      });
    }

    const sha256 = sha256DeArchivo(req.file.path);

    const nuevaVersion = await ExcelTemplateVersion.create({
      template_id: plantilla.id,
      version,
      nombre_original: req.file.originalname,
      archivo_almacenado: req.file.filename,
      sha256,
      cambios: cambios || null,
      subido_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'excel_template_version',
      entidad_id: nuevaVersion.id,
      cambios_nuevos: { plantilla: plantilla.codigo, version, sha256 },
      ip_address: req.ip,
    });

    logger.info(`[EXCEL_TEMPLATES] Versión ${version} subida para ${plantilla.codigo} por ${req.user.email} (sha256=${sha256})`);

    const versionCompleta = await ExcelTemplateVersion.findByPk(nuevaVersion.id, { include: VERSION_INCLUDES });
    res.status(201).json({ success: true, message: 'Versión subida correctamente', data: versionCompleta });
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error subiendo versión: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_VERSION_ERROR', message: 'Error subiendo la versión' },
    });
  }
};

// Marca una versión como vigente: desmarca la anterior (si existía) en la
// misma transacción y actualiza el estado de la plantilla. El índice único
// parcial en BD es la red de seguridad ante condiciones de carrera.
exports.marcarVersionVigente = async (req, res) => {
  try {
    const { id, versionId } = req.params;

    const plantilla = await ExcelTemplate.findByPk(id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    if (plantilla.estado === 'obsoleta') {
      return res.status(400).json({
        success: false,
        error: { code: 'TEMPLATE_OBSOLETE', message: 'No se puede activar una versión de una plantilla obsoleta' },
      });
    }

    const version = await ExcelTemplateVersion.findOne({ where: { id: versionId, template_id: id } });
    if (!version) {
      return res.status(404).json({
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'La versión no existe para esta plantilla' },
      });
    }
    if (version.vigente) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_CURRENT', message: 'Esta versión ya es la vigente' },
      });
    }

    await sequelize.transaction(async (t) => {
      await ExcelTemplateVersion.update(
        { vigente: false },
        { where: { template_id: id, vigente: true }, transaction: t }
      );

      version.vigente = true;
      version.aprobado_por = req.user.id;
      version.fecha_aprobacion = new Date();
      await version.save({ transaction: t });

      if (plantilla.estado !== 'vigente') {
        plantilla.estado = 'vigente';
        await plantilla.save({ transaction: t });
      }
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'aprobar',
      entidad: 'excel_template_version',
      entidad_id: version.id,
      cambios_nuevos: { plantilla: plantilla.codigo, version: version.version },
      detalles: `Versión ${version.version} marcada vigente para ${plantilla.codigo}`,
      ip_address: req.ip,
    });

    logger.info(`[EXCEL_TEMPLATES] Versión ${version.version} de ${plantilla.codigo} marcada vigente por ${req.user.email}`);

    const versionCompleta = await ExcelTemplateVersion.findByPk(version.id, { include: VERSION_INCLUDES });
    res.json({ success: true, message: 'Versión marcada como vigente', data: versionCompleta });
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error marcando versión vigente: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'MARK_CURRENT_ERROR', message: 'Error marcando la versión como vigente' },
    });
  }
};

// Obsoleta la plantilla completa: ninguna de sus versiones queda vigente
// (no se sirven más descargas de ella en la tarea 2.2).
exports.obsoletarTemplate = async (req, res) => {
  try {
    const plantilla = await ExcelTemplate.findByPk(req.params.id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }
    if (plantilla.estado === 'obsoleta') {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_OBSOLETE', message: 'Esta plantilla ya está obsoleta' },
      });
    }

    const estadoAnterior = plantilla.estado;

    await sequelize.transaction(async (t) => {
      await ExcelTemplateVersion.update(
        { vigente: false },
        { where: { template_id: plantilla.id, vigente: true }, transaction: t }
      );
      plantilla.estado = 'obsoleta';
      await plantilla.save({ transaction: t });
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'archivar',
      entidad: 'excel_template',
      entidad_id: plantilla.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado: 'obsoleta' },
      ip_address: req.ip,
    });

    logger.info(`[EXCEL_TEMPLATES] Plantilla ${plantilla.codigo} obsoletada por ${req.user.email}`);

    res.json({ success: true, message: 'Plantilla marcada como obsoleta', data: plantilla });
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error obsoletando plantilla: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'OBSOLETE_TEMPLATE_ERROR', message: 'Error marcando la plantilla como obsoleta' },
    });
  }
};

// Descarga controlada (tarea 2.2): SIEMPRE resuelve la versión vigente en el
// servidor, sin que la URL/parámetros puedan elegir otra. Si no hay ninguna
// versión vigente (plantilla en borrador u obsoleta sin activar ninguna),
// no hay nada que descargar.
exports.downloadCurrentVersion = async (req, res) => {
  try {
    const plantilla = await ExcelTemplate.findByPk(req.params.id);
    if (!plantilla) {
      return res.status(404).json({
        success: false,
        error: { code: 'TEMPLATE_NOT_FOUND', message: 'La plantilla no existe' },
      });
    }

    const versionVigente = await ExcelTemplateVersion.findOne({ where: { template_id: plantilla.id, vigente: true } });
    if (!versionVigente) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_CURRENT_VERSION', message: 'Esta plantilla no tiene ninguna versión vigente para descargar' },
      });
    }

    const filePath = path.join(uploadDirectory, versionVigente.archivo_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'excel_template_version',
      entidad_id: versionVigente.id,
      detalles: `Descarga de plantilla ${plantilla.codigo} versión ${versionVigente.version} (vigente)`,
      ip_address: req.ip,
    });

    logger.info(`[EXCEL_TEMPLATES] ${plantilla.codigo} v${versionVigente.version} descargada por ${req.user.email}`);

    return res.download(filePath, versionVigente.nombre_original);
  } catch (error) {
    logger.error(`[EXCEL_TEMPLATES] Error descargando plantilla: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_TEMPLATE_ERROR', message: 'Error descargando la plantilla' },
    });
  }
};
