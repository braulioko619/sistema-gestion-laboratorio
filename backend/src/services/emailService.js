const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

// Envía el PDF de un certificado de calibración al correo de contacto del cliente.
async function sendCertificateEmail({ to, cliente, certificado, filePath }) {
  const client = getTransporter();
  if (!client) {
    const message = 'SMTP no configurado (falta SMTP_HOST) - no se pudo enviar el certificado.';
    logger.error(`[EMAIL] ${message}`);
    return { success: false, error: message };
  }

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Certificado de calibración ${certificado.codigo} - ${cliente.nombre}`,
      text: `Estimado(a) ${cliente.contacto_nombre || cliente.nombre},\n\n` +
        `Adjuntamos el certificado de calibración ${certificado.codigo}.\n\n` +
        'Saludos,\nLaboratorio de Calibraciones',
      attachments: [
        {
          filename: certificado.nombre_original || `${certificado.codigo}.pdf`,
          path: filePath,
        },
      ],
    });
    logger.info(`[EMAIL] Certificado ${certificado.codigo} enviado a ${to}`);
    return { success: true };
  } catch (error) {
    logger.error(`[EMAIL] Error enviando certificado ${certificado.codigo}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Envía el resumen de alertas de estabilidad nuevas detectadas por el job
// diario (tarea 3.5) a los roles de gestión. Una sola alerta activa nunca
// vuelve a generar un envío mientras siga sin resolverse (StabilityAlertService
// solo llama a esta función con alertas recién creadas).
async function sendStabilityAlertsEmail({ to, alertas }) {
  const client = getTransporter();
  if (!client) {
    const message = 'SMTP no configurado (falta SMTP_HOST) - no se pudo enviar el resumen de alertas de estabilidad.';
    logger.error(`[EMAIL] ${message}`);
    return { success: false, error: message };
  }

  const lineas = alertas.map((a) => `- [${a.tipo}] ${a.mensaje}`).join('\n');

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Alertas de estabilidad de patrones (${alertas.length} nueva(s))`,
      text: `Se detectaron ${alertas.length} alerta(s) nueva(s) de estabilidad de patrones:\n\n${lineas}\n\n` +
        'Revisar en el módulo de Equipos del sistema.\n\nSaludos,\nLaboratorio de Calibraciones',
    });
    logger.info(`[EMAIL] Resumen de ${alertas.length} alerta(s) de estabilidad enviado a ${to.join(', ')}`);
    return { success: true };
  } catch (error) {
    logger.error(`[EMAIL] Error enviando resumen de alertas de estabilidad: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = { sendCertificateEmail, sendStabilityAlertsEmail };
