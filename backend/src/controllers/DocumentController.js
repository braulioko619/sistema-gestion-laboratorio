const path = require('path');
const fs = require('fs');
const { Document, DocumentVersion, DocumentAttachment, ProcedureAuthorization, User, AuditLog } = require('../models');
const { uploadDirectory } = require('../middleware/uploadDocumentAttachments');
const logger = require('../config/logger');

// Crear documento
exports.createDocument = async (req, res) => {
  try {
    const { titulo, descripcion, tipo_documento, contenido } = req.body;

    const document = await Document.create({
      titulo,
      descripcion,
      tipo_documento,
      contenido,
      creado_por: req.user.id,
      estado: 'borrador',
    });

    // Crear versión inicial
    await DocumentVersion.create({
      document_id: document.id,
      version_numero: 1,
      contenido,
      autor_id: req.user.id,
      cambios_realizados: 'Versión inicial',
    });

    // Adjuntos opcionales (multipart/form-data, campo "archivos")
    if (req.files && req.files.length > 0) {
      await DocumentAttachment.bulkCreate(
        req.files.map((file) => ({
          document_id: document.id,
          nombre_original: file.originalname,
          nombre_almacenado: file.filename,
          tipo_mime: file.mimetype,
          tamano_bytes: file.size,
          subido_por: req.user.id,
        }))
      );
    }

    // Registrar auditoría
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'document',
      entidad_id: document.id,
      cambios_nuevos: { titulo, tipo_documento },
      ip_address: req.ip,
    });

    logger.info(`[DOCUMENT] Documento creado: ${document.id} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Documento creado correctamente',
      data: document,
    });
  } catch (error) {
    logger.error(`[DOCUMENT] Error creando documento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_DOCUMENT_ERROR',
        message: 'Error creando documento',
      },
    });
  }
};

// Obtener todos los documentos
exports.getDocuments = async (req, res) => {
  try {
    const { estado, tipo_documento, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (tipo_documento) where.tipo_documento = tipo_documento;

    const { rows, count } = await Document.findAndCountAll({
      where,
      include: [
        { model: User, as: 'autor', attributes: ['id', 'nombre', 'email'] },
        { model: DocumentAttachment, as: 'adjuntos' },
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error(`[DOCUMENT] Error obteniendo documentos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DOCUMENTS_ERROR',
        message: 'Error obteniendo documentos',
      },
    });
  }
};

// Obtener documento por ID
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id, {
      include: [
        { model: User, as: 'autor', attributes: ['id', 'nombre', 'email'] },
        { model: DocumentVersion, as: 'versiones' },
        { model: DocumentAttachment, as: 'adjuntos' },
      ],
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento no encontrado',
        },
      });
    }

    // Registrar auditoría
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'ver',
      entidad: 'document',
      entidad_id: id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error(`[DOCUMENT] Error obteniendo documento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DOCUMENT_ERROR',
        message: 'Error obteniendo documento',
      },
    });
  }
};

// Actualizar documento
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, contenido, cambios_realizados } = req.body;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento no encontrado',
        },
      });
    }

    // Guardar valores anteriores para auditoría
    const previousValues = {
      titulo: document.titulo,
      descripcion: document.descripcion,
    };

    // Actualizar documento
    await document.update({
      titulo: titulo || document.titulo,
      descripcion: descripcion || document.descripcion,
      contenido: contenido || document.contenido,
      modificado_por: req.user.id,
    });

    // Si hay nuevo contenido, crear nueva versión
    if (contenido) {
      const newVersion = document.version_actual + 1;
      await DocumentVersion.create({
        document_id: id,
        version_numero: newVersion,
        contenido,
        autor_id: req.user.id,
        cambios_realizados: cambios_realizados || 'Actualización',
      });

      await document.update({ version_actual: newVersion });
    }

    // Registrar auditoría
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'document',
      entidad_id: id,
      cambios_anteriores: previousValues,
      cambios_nuevos: { titulo, descripcion },
      ip_address: req.ip,
    });

    logger.info(`[DOCUMENT] Documento actualizado: ${id} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Documento actualizado correctamente',
      data: document,
    });
  } catch (error) {
    logger.error(`[DOCUMENT] Error actualizando documento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_DOCUMENT_ERROR',
        message: 'Error actualizando documento',
      },
    });
  }
};

// Publicar documento
exports.publishDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento no encontrado',
        },
      });
    }

    await document.update({
      estado: 'publicado',
      fecha_publicacion: new Date(),
    });

    // Registrar auditoría
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'publicar',
      entidad: 'document',
      entidad_id: id,
      ip_address: req.ip,
    });

    logger.info(`[DOCUMENT] Documento publicado: ${id} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Documento publicado correctamente',
      data: document,
    });
  } catch (error) {
    logger.error(`[DOCUMENT] Error publicando documento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'PUBLISH_DOCUMENT_ERROR',
        message: 'Error publicando documento',
      },
    });
  }
};

// Archivar documento
exports.archiveDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento no encontrado',
        },
      });
    }

    await document.update({ estado: 'archivado' });

    // Registrar auditoría
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'archivar',
      entidad: 'document',
      entidad_id: id,
      ip_address: req.ip,
    });

    logger.info(`[DOCUMENT] Documento archivado: ${id} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Documento archivado correctamente',
      data: document,
    });
  } catch (error) {
    logger.error(`[DOCUMENT] Error archivando documento: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'ARCHIVE_DOCUMENT_ERROR',
        message: 'Error archivando documento',
      },
    });
  }
};

// Descargar un adjunto de un documento. La descarga exige autenticación.
exports.downloadDocumentAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await DocumentAttachment.findByPk(attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: { code: 'ATTACHMENT_NOT_FOUND', message: 'El adjunto no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, attachment.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'document_attachment',
      entidad_id: attachment.id,
      ip_address: req.ip,
    });

    return res.download(filePath, attachment.nombre_original);
  } catch (error) {
    logger.error(`[DOCUMENT] Error descargando adjunto: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_ATTACHMENT_ERROR', message: 'Error descargando el adjunto' },
    });
  }
};

// Listar las autorizaciones de procedimiento de un documento
exports.getProcedureAuthorizations = async (req, res) => {
  try {
    const { id } = req.params;
    const autorizaciones = await ProcedureAuthorization.findAll({
      where: { document_id: id },
      include: [
        { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
        { model: User, as: 'otorgante', attributes: ['id', 'nombre', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: autorizaciones });
  } catch (error) {
    logger.error(`[DOCUMENT] Error obteniendo autorizaciones: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_PROCEDURE_AUTHORIZATIONS_ERROR', message: 'Error obteniendo autorizaciones' },
    });
  }
};

// Otorgar autorización a una persona para ejecutar el procedimiento del documento
exports.grantProcedureAuthorization = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, fecha_autorizacion, fecha_vencimiento, alcance, magnitud, observaciones } = req.body;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe indicar la persona a autorizar' },
      });
    }

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'El documento no existe' },
      });
    }

    const user = await User.findByPk(usuario_id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'La persona no existe o está inactiva' } });

    const [authorization, created] = await ProcedureAuthorization.findOrCreate({
      where: { document_id: id, user_id: usuario_id, estado: 'autorizado' },
      defaults: {
        fecha_autorizacion: fecha_autorizacion || new Date(),
        fecha_vencimiento,
        alcance,
        magnitud: magnitud || null,
        autorizado_por: req.user.id,
        observaciones,
      },
    });

    if (created) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'crear',
        entidad: 'procedure_authorization',
        entidad_id: authorization.id,
        cambios_nuevos: { document_id: id, usuario_id },
        ip_address: req.ip,
      });
    }

    return res.status(created ? 201 : 200).json({ success: true, message: 'Autorización registrada', data: authorization });
  } catch (error) {
    logger.error(`[DOCUMENT] Error otorgando autorización: ${error.message}`);
    return res.status(500).json({ success: false, error: { code: 'GRANT_PROCEDURE_AUTHORIZATION_ERROR', message: 'Error registrando autorización' } });
  }
};

// Revocar una autorización de procedimiento
exports.revokeProcedureAuthorization = async (req, res) => {
  try {
    const { authorizationId } = req.params;
    const authorization = await ProcedureAuthorization.findByPk(authorizationId);

    if (!authorization) return res.status(404).json({ success: false, error: { code: 'AUTHORIZATION_NOT_FOUND', message: 'La autorización no existe' } });
    if (authorization.estado === 'revocado') return res.status(409).json({ success: false, error: { code: 'ALREADY_REVOKED', message: 'La autorización ya está revocada' } });

    authorization.estado = 'revocado';
    await authorization.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'procedure_authorization',
      entidad_id: authorization.id,
      cambios_nuevos: { estado: 'revocado' },
      ip_address: req.ip,
    });

    return res.json({ success: true, message: 'Autorización revocada', data: authorization });
  } catch (error) {
    logger.error(`[DOCUMENT] Error revocando autorización: ${error.message}`);
    return res.status(500).json({ success: false, error: { code: 'REVOKE_PROCEDURE_AUTHORIZATION_ERROR', message: 'Error revocando autorización' } });
  }
};
