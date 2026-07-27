const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  CalibrationDataFile,
  WorkOrderItem,
  ExcelTemplateVersion,
  ExcelTemplate,
  User,
  AuditLog,
} = require('../models');
const { uploadDirectory } = require('../middleware/uploadCalibrationDataFile');
const logger = require('../config/logger');

const DATA_FILE_INCLUDES = [
  { model: User, as: 'subidoPor', attributes: ['id', 'nombre', 'email'] },
  {
    model: ExcelTemplateVersion,
    as: 'versionPlantilla',
    attributes: ['id', 'version'],
    include: [{ model: ExcelTemplate, as: 'plantilla', attributes: ['id', 'codigo', 'nombre'] }],
  },
];

function sha256DeArchivo(rutaAbsoluta) {
  return crypto.createHash('sha256').update(fs.readFileSync(rutaAbsoluta)).digest('hex');
}

// Sube el Excel de raw data para un ítem de OT. Nunca reemplaza: cada subida
// crea una fila nueva, la anterior queda como histórico (inmutable).
exports.uploadDataFile = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { template_version_id, observaciones } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar el archivo Excel con los datos crudos' },
      });
    }

    const item = await WorkOrderItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem de la orden de trabajo no existe' },
      });
    }

    if (template_version_id) {
      const versionPlantilla = await ExcelTemplateVersion.findByPk(template_version_id);
      if (!versionPlantilla) {
        return res.status(400).json({
          success: false,
          error: { code: 'TEMPLATE_VERSION_NOT_FOUND', message: 'La versión de plantilla indicada no existe' },
        });
      }
    }

    const sha256 = sha256DeArchivo(req.file.path);

    const archivo = await CalibrationDataFile.create({
      work_order_item_id: item.id,
      template_version_id: template_version_id || null,
      nombre_original: req.file.originalname,
      archivo_almacenado: req.file.filename,
      sha256,
      hash_verificado: true,
      observaciones: observaciones || null,
      subido_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_data_file',
      entidad_id: archivo.id,
      cambios_nuevos: { item_id: item.id, sha256 },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_DATA_FILES] Raw data subido para ítem ${item.id} por ${req.user.email} (sha256=${sha256})`);

    const archivoCompleto = await CalibrationDataFile.findByPk(archivo.id, { include: DATA_FILE_INCLUDES });
    res.status(201).json({ success: true, message: 'Archivo de datos subido correctamente', data: archivoCompleto });
  } catch (error) {
    logger.error(`[CALIBRATION_DATA_FILES] Error subiendo raw data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_DATA_FILE_ERROR', message: 'Error subiendo el archivo de datos' },
    });
  }
};

// Histórico completo del ítem, más reciente primero.
exports.getDataFilesForItem = async (req, res) => {
  try {
    const archivos = await CalibrationDataFile.findAll({
      where: { work_order_item_id: req.params.itemId },
      include: DATA_FILE_INCLUDES,
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: archivos });
  } catch (error) {
    logger.error(`[CALIBRATION_DATA_FILES] Error listando raw data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_DATA_FILES_ERROR', message: 'Error obteniendo el histórico de archivos de datos' },
    });
  }
};

exports.downloadDataFile = async (req, res) => {
  try {
    const archivo = await CalibrationDataFile.findByPk(req.params.id);
    if (!archivo) {
      return res.status(404).json({
        success: false,
        error: { code: 'DATA_FILE_NOT_FOUND', message: 'El archivo no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, archivo.archivo_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'calibration_data_file',
      entidad_id: archivo.id,
      ip_address: req.ip,
    });

    return res.download(filePath, archivo.nombre_original);
  } catch (error) {
    logger.error(`[CALIBRATION_DATA_FILES] Error descargando raw data: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_DATA_FILE_ERROR', message: 'Error descargando el archivo' },
    });
  }
};

// Recalcula el hash del archivo que hoy está en disco y lo compara contra el
// sha256 registrado al subirlo. Detecta si el archivo fue alterado o
// corrompido después de la subida original.
exports.verifyDataFile = async (req, res) => {
  try {
    const archivo = await CalibrationDataFile.findByPk(req.params.id);
    if (!archivo) {
      return res.status(404).json({
        success: false,
        error: { code: 'DATA_FILE_NOT_FOUND', message: 'El archivo no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, archivo.archivo_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    const hashActual = sha256DeArchivo(filePath);
    const coincide = hashActual === archivo.sha256;

    archivo.hash_verificado = coincide;
    await archivo.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'ver',
      entidad: 'calibration_data_file',
      entidad_id: archivo.id,
      detalles: coincide
        ? 'Verificación de integridad: hash coincide'
        : `Verificación de integridad: hash NO coincide (registrado ${archivo.sha256}, actual ${hashActual})`,
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_DATA_FILES] Verificación de integridad de ${archivo.id}: ${coincide ? 'OK' : 'FALLÓ'}`);

    res.json({
      success: true,
      message: coincide ? 'El archivo conserva su integridad' : 'El archivo fue alterado: el hash no coincide',
      data: { id: archivo.id, sha256_registrado: archivo.sha256, sha256_actual: hashActual, hash_verificado: coincide },
    });
  } catch (error) {
    logger.error(`[CALIBRATION_DATA_FILES] Error verificando integridad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'VERIFY_DATA_FILE_ERROR', message: 'Error verificando la integridad del archivo' },
    });
  }
};
