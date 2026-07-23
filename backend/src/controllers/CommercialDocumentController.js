const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const {
  CommercialDocument,
  Client,
  WorkOrder,
  User,
  AuditLog,
} = require('../models');
const { uploadDirectory } = require('../middleware/uploadCommercialDocument');
const logger = require('../config/logger');

const TIPOS_VALIDOS = ['orden_compra', 'factura', 'nota_credito'];

const DOCUMENT_INCLUDES = [
  { model: Client, as: 'cliente', attributes: ['id', 'nombre', 'identificacion_fiscal'] },
  { model: WorkOrder, as: 'ordenTrabajo', attributes: ['id', 'codigo'] },
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
  { model: CommercialDocument, as: 'documentoRelacionado', attributes: ['id', 'tipo', 'numero'] },
];

exports.createCommercialDocument = async (req, res) => {
  try {
    const {
      cliente_id,
      orden_trabajo_id,
      documento_relacionado_id,
      tipo,
      numero,
      fecha_emision,
      monto,
      moneda,
      notas,
    } = req.body;

    if (!cliente_id || !tipo || !numero || !fecha_emision) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cliente, tipo, número y fecha de emisión son obligatorios' },
      });
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` },
      });
    }

    const cliente = await Client.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({ success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' } });
    }

    const existente = await CommercialDocument.findOne({ where: { cliente_id, tipo, numero } });
    if (existente) {
      return res.status(409).json({
        success: false,
        error: { code: 'DOCUMENT_EXISTS', message: `Ya existe un documento de tipo "${tipo}" con el número ${numero} para este cliente` },
      });
    }

    const documento = await CommercialDocument.create({
      cliente_id,
      orden_trabajo_id: orden_trabajo_id || null,
      documento_relacionado_id: documento_relacionado_id || null,
      tipo,
      numero,
      fecha_emision,
      monto: monto || null,
      moneda: moneda || 'CLP',
      notas,
      nombre_original: req.file?.originalname,
      nombre_almacenado: req.file?.filename,
      tipo_mime: req.file?.mimetype,
      tamano_bytes: req.file?.size,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'commercial_document',
      entidad_id: documento.id,
      cambios_nuevos: { cliente_id, tipo, numero },
      ip_address: req.ip,
    });

    logger.info(`[COMMERCIAL_DOCS] ${tipo} ${numero} registrado para ${cliente.nombre} por ${req.user.email}`);

    res.status(201).json({ success: true, message: `Documento ${numero} registrado correctamente`, data: documento });
  } catch (error) {
    logger.error(`[COMMERCIAL_DOCS] Error creando documento: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_DOCUMENT_ERROR', message: 'Error registrando el documento' } });
  }
};

exports.getCommercialDocuments = async (req, res) => {
  try {
    const { cliente_id, orden_trabajo_id, tipo, estado, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (cliente_id) where.cliente_id = cliente_id;
    if (orden_trabajo_id) where.orden_trabajo_id = orden_trabajo_id;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (search) where.numero = { [Op.iLike]: `%${search}%` };

    const { rows, count } = await CommercialDocument.findAndCountAll({
      where,
      include: DOCUMENT_INCLUDES,
      offset,
      limit: parseInt(limit),
      order: [['fecha_emision', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    logger.error(`[COMMERCIAL_DOCS] Error listando documentos: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_DOCUMENTS_ERROR', message: 'Error obteniendo los documentos' } });
  }
};

exports.getCommercialDocumentById = async (req, res) => {
  try {
    const documento = await CommercialDocument.findByPk(req.params.id, {
      include: [
        ...DOCUMENT_INCLUDES,
        { model: CommercialDocument, as: 'documentosRelacionados', attributes: ['id', 'tipo', 'numero', 'estado'] },
      ],
    });

    if (!documento) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'El documento no existe' } });
    }

    res.json({ success: true, data: documento });
  } catch (error) {
    logger.error(`[COMMERCIAL_DOCS] Error obteniendo documento: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_DOCUMENT_ERROR', message: 'Error obteniendo el documento' } });
  }
};

exports.updateCommercialDocument = async (req, res) => {
  try {
    const documento = await CommercialDocument.findByPk(req.params.id);
    if (!documento) {
      return res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'El documento no existe' } });
    }

    if (req.body.estado && !['vigente', 'anulado'].includes(req.body.estado)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El estado debe ser "vigente" o "anulado"' } });
    }

    const camposPermitidos = ['numero', 'fecha_emision', 'monto', 'moneda', 'orden_trabajo_id', 'documento_relacionado_id', 'estado', 'notas'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== documento[campo]) {
        cambiosAnteriores[campo] = documento[campo];
        cambiosNuevos[campo] = req.body[campo];
        documento[campo] = req.body[campo];
      }
    });

    await documento.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'commercial_document',
        entidad_id: documento.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[COMMERCIAL_DOCS] Documento ${documento.numero} actualizado por ${req.user.email}`);
    res.json({ success: true, message: 'Documento actualizado correctamente', data: documento });
  } catch (error) {
    logger.error(`[COMMERCIAL_DOCS] Error actualizando documento: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_DOCUMENT_ERROR', message: 'Error actualizando el documento' } });
  }
};

exports.downloadCommercialDocument = async (req, res) => {
  try {
    const documento = await CommercialDocument.findByPk(req.params.id);
    if (!documento || !documento.nombre_almacenado) {
      return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'Este documento no tiene un archivo adjunto' } });
    }

    const filePath = path.join(uploadDirectory, documento.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' } });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'commercial_document',
      entidad_id: documento.id,
      ip_address: req.ip,
    });

    return res.download(filePath, documento.nombre_original);
  } catch (error) {
    logger.error(`[COMMERCIAL_DOCS] Error descargando documento: ${error.message}`);
    return res.status(500).json({ success: false, error: { code: 'DOWNLOAD_DOCUMENT_ERROR', message: 'Error descargando el documento' } });
  }
};
