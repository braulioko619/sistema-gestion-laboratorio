const path = require('path');
const fs = require('fs');
const {
  CalibrationCertificate,
  WorkOrderItem,
  WorkOrder,
  Client,
  ClientInstrument,
  ClientContact,
  AuditLog,
} = require('../models');
const { uploadDirectory } = require('../middleware/uploadCalibrationCertificate');
const { sendCertificateEmail } = require('../services/emailService');
const logger = require('../config/logger');

const CERTIFICATE_INCLUDES = [
  {
    model: WorkOrderItem,
    as: 'item',
    include: [
      { model: ClientInstrument, as: 'instrumento' },
      {
        model: WorkOrder,
        as: 'ordenTrabajo',
        include: [{ model: Client, as: 'cliente' }],
      },
    ],
  },
];

// Subir el PDF firmado del certificado para un ítem de orden de trabajo (borrador)
exports.uploadCertificate = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar el certificado en PDF' },
      });
    }

    const item = await WorkOrderItem.findByPk(itemId, {
      include: [{ model: CalibrationCertificate, as: 'certificado' }],
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem de la orden de trabajo no existe' },
      });
    }
    if (item.certificado) {
      return res.status(409).json({
        success: false,
        error: { code: 'CERTIFICATE_EXISTS', message: 'Este ítem ya tiene un certificado registrado' },
      });
    }

    const codigo = await CalibrationCertificate.generarCodigo();

    const certificado = await CalibrationCertificate.create({
      codigo,
      orden_trabajo_item_id: item.id,
      estado: 'borrador',
      nombre_original: req.file.originalname,
      nombre_almacenado: req.file.filename,
      tipo_mime: req.file.mimetype,
      tamano_bytes: req.file.size,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_nuevos: { codigo, item_id: item.id },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${codigo} subido por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Certificado ${codigo} registrado en borrador`,
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error subiendo certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_CERTIFICATE_ERROR', message: 'Error subiendo el certificado' },
    });
  }
};

// Transición de estado: borrador -> firmado -> emitido
exports.updateCertificateEstado = async (req, res) => {
  try {
    const { estado, fecha_emision, fecha_calibracion } = req.body;
    const ESTADOS_PERMITIDOS = ['borrador', 'firmado', 'emitido'];

    if (!estado || !ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`,
        },
      });
    }

    const certificado = await CalibrationCertificate.findByPk(req.params.id);
    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    const estadoAnterior = certificado.estado;
    certificado.estado = estado;
    if (fecha_emision !== undefined) certificado.fecha_emision = fecha_emision;
    if (fecha_calibracion !== undefined) certificado.fecha_calibracion = fecha_calibracion;
    await certificado.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} pasó de ${estadoAnterior} a ${estado} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Estado del certificado actualizado correctamente',
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error actualizando estado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_CERTIFICATE_ESTADO_ERROR', message: 'Error actualizando el estado del certificado' },
    });
  }
};

// Descargar el PDF del certificado. La descarga exige autenticación.
exports.downloadCertificate = async (req, res) => {
  try {
    const certificado = await CalibrationCertificate.findByPk(req.params.id);
    if (!certificado || !certificado.nombre_almacenado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, certificado.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      ip_address: req.ip,
    });

    return res.download(filePath, certificado.nombre_original);
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error descargando certificado: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_CERTIFICATE_ERROR', message: 'Error descargando el certificado' },
    });
  }
};

// Enviar el certificado emitido al correo de contacto del cliente
exports.sendCertificate = async (req, res) => {
  try {
    const certificado = await CalibrationCertificate.findByPk(req.params.id, {
      include: CERTIFICATE_INCLUDES,
    });
    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    if (certificado.estado !== 'emitido') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_EMITTED',
          message: 'El certificado debe estar en estado "emitido" antes de enviarlo',
        },
      });
    }

    const cliente = certificado.item?.ordenTrabajo?.cliente;

    // Se puede elegir un contacto guardado del cliente (contacto_id), escribir
    // un correo puntual (email_destino), o si no se manda nada se usa el
    // correo de contacto principal del cliente.
    let destinatario = req.body.email_destino;
    if (!destinatario && req.body.contacto_id) {
      const contacto = await ClientContact.findOne({ where: { id: req.body.contacto_id, cliente_id: cliente?.id } });
      if (!contacto || !contacto.email) {
        return res.status(400).json({
          success: false,
          error: { code: 'CONTACT_WITHOUT_EMAIL', message: 'El contacto seleccionado no tiene un correo registrado' },
        });
      }
      destinatario = contacto.email;
    }
    destinatario = destinatario || cliente?.email_contacto;

    if (!destinatario) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_CONTACT_EMAIL', message: 'El cliente no tiene un correo de contacto configurado' },
      });
    }

    const filePath = path.join(uploadDirectory, certificado.nombre_almacenado);
    const resultado = await sendCertificateEmail({
      to: destinatario,
      cliente,
      certificado,
      filePath,
    });

    certificado.enviado_a = destinatario;
    certificado.fecha_envio = new Date();
    certificado.estado_envio = resultado.success ? 'enviado' : 'fallido';
    if (resultado.success) certificado.estado = 'enviado';
    await certificado.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'enviar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_nuevos: { enviado_a: destinatario, estado_envio: certificado.estado_envio },
      ip_address: req.ip,
    });

    if (!resultado.success) {
      logger.error(`[CALIBRATION_CERTIFICATES] Falló el envío de ${certificado.codigo}: ${resultado.error}`);
      return res.status(502).json({
        success: false,
        error: { code: 'SEND_CERTIFICATE_FAILED', message: `No se pudo enviar el certificado: ${resultado.error}` },
      });
    }

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} enviado a ${destinatario} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Certificado enviado a ${destinatario}`,
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error enviando certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'SEND_CERTIFICATE_ERROR', message: 'Error enviando el certificado' },
    });
  }
};
