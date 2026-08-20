const fs = require('fs');
const path = require('path');
const { Equipment, EquipmentDocument, User, AuditLog } = require('../models');
const { uploadDirectory } = require('../middleware/uploadEquipmentDocument');
const logger = require('../config/logger');

const DOCUMENT_INCLUDES = [
  { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'firmante', attributes: ['id', 'nombre', 'email'] },
];

const CATEGORIAS_VALIDAS = new Set(['manual', 'protocolo', 'ficha_tecnica', 'certificado_calibracion', 'otro']);

// Sube uno o más documentos (manuales, protocolos, fichas técnicas u otros
// exigidos por NCh-ISO/IEC 17025, la SEC o el ISP). Distinto de los
// certificados de calibración con puntos medidos, que se registran en
// StandardCalibrationHistory (historial de calibración de patrones).
exports.uploadDocuments = async (req, res) => {
  try {
    const equipo = await Equipment.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El equipo no existe' },
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar al menos un archivo' },
      });
    }

    const { categoria, descripcion } = req.body;
    if (categoria && !CATEGORIAS_VALIDAS.has(categoria)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `categoria debe ser una de: ${[...CATEGORIAS_VALIDAS].join(', ')}` },
      });
    }

    const documentos = await EquipmentDocument.bulkCreate(
      req.files.map((file) => ({
        equipment_id: equipo.id,
        categoria: categoria || 'otro',
        descripcion: descripcion || null,
        nombre_original: file.originalname,
        nombre_almacenado: file.filename,
        tipo_mime: file.mimetype,
        tamano_bytes: file.size,
        subido_por: req.user.id,
      }))
    );

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'equipment_document',
      entidad_id: equipo.id,
      cambios_nuevos: { equipo: equipo.codigo, categoria: categoria || 'otro', documentos: documentos.length },
      ip_address: req.ip,
    });

    logger.info(`[EQUIPMENT_DOCUMENT] ${documentos.length} documento(s) subido(s) para ${equipo.codigo} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${documentos.length} documento(s) subido(s) correctamente`,
      data: documentos,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT_DOCUMENT] Error subiendo documentos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_DOCUMENT_ERROR', message: 'Error subiendo los documentos' },
    });
  }
};

exports.listDocuments = async (req, res) => {
  try {
    const { categoria } = req.query;
    const where = { equipment_id: req.params.id };
    if (categoria) where.categoria = categoria;

    const documentos = await EquipmentDocument.findAll({
      where,
      include: DOCUMENT_INCLUDES,
      order: [['categoria', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, data: documentos });
  } catch (error) {
    logger.error(`[EQUIPMENT_DOCUMENT] Error listando documentos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_DOCUMENTS_ERROR', message: 'Error obteniendo los documentos' },
    });
  }
};

// Descarga de un documento. Sin endpoint de borrado: es un registro
// permanente (igual criterio que los adjuntos de QualityRecord); un
// documento erróneo se reemplaza subiendo uno nuevo.
exports.downloadDocument = async (req, res) => {
  try {
    const documento = await EquipmentDocument.findByPk(req.params.documentId);
    if (!documento) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'El documento no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, documento.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'equipment_document',
      entidad_id: documento.id,
      ip_address: req.ip,
    });

    return res.download(filePath, documento.nombre_original);
  } catch (error) {
    logger.error(`[EQUIPMENT_DOCUMENT] Error descargando documento: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_DOCUMENT_ERROR', message: 'Error descargando el documento' },
    });
  }
};

// Entrega el archivo para verlo en pantalla, no para guardarlo: mismo archivo
// que downloadDocument pero con Content-Disposition inline, de modo que el
// visor del frontend pueda mostrarlo sin forzar una descarga.
exports.previewDocument = async (req, res) => {
  try {
    const documento = await EquipmentDocument.findByPk(req.params.documentId);
    if (!documento) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'El documento no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, documento.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    res.setHeader('Content-Type', documento.tipo_mime || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(documento.nombre_original)}"`
    );
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    logger.error(`[EQUIPMENT_DOCUMENT] Error visualizando documento: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'PREVIEW_DOCUMENT_ERROR', message: 'Error abriendo el documento' },
    });
  }
};

// Firma de revisión: aprueba o rechaza un documento (certificado de
// calibración, verificación u otro). Deja registrado quién firmó, cuándo y,
// si rechazó, por qué. Se puede volver a firmar para corregir una decisión;
// cada firma queda en la bitácora de auditoría.
exports.signDocument = async (req, res) => {
  try {
    const { estado, comentario } = req.body;

    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'estado debe ser "aprobado" o "rechazado"' },
      });
    }

    // El motivo del rechazo es obligatorio: sin él, el registro no sirve como
    // evidencia frente a una auditoría.
    if (estado === 'rechazado' && !String(comentario || '').trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe indicar el motivo del rechazo' },
      });
    }

    const documento = await EquipmentDocument.findByPk(req.params.documentId);
    if (!documento) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'El documento no existe' },
      });
    }

    const estadoAnterior = documento.estado_firma;

    documento.estado_firma = estado;
    documento.firmado_por = req.user.id;
    documento.firmado_en = new Date();
    documento.comentario_firma = String(comentario || '').trim() || null;
    await documento.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'equipment_document',
      entidad_id: documento.id,
      cambios_anteriores: { estado_firma: estadoAnterior },
      cambios_nuevos: {
        estado_firma: estado,
        comentario_firma: documento.comentario_firma,
        documento: documento.nombre_original,
      },
      ip_address: req.ip,
    });

    logger.info(
      `[EQUIPMENT_DOCUMENT] ${documento.nombre_original} ${estado} por ${req.user.email}`
    );

    const actualizado = await EquipmentDocument.findByPk(documento.id, {
      include: DOCUMENT_INCLUDES,
    });

    return res.json({
      success: true,
      message: estado === 'aprobado' ? 'Documento aprobado' : 'Documento rechazado',
      data: actualizado,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT_DOCUMENT] Error firmando documento: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'SIGN_DOCUMENT_ERROR', message: 'Error registrando la firma' },
    });
  }
};
