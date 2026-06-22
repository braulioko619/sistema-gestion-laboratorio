const { Document, DocumentVersion, User, AuditLog } = require('../models');
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
      include: [{ model: User, as: 'autor', attributes: ['id', 'nombre', 'email'] }],
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
