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

module.exports = { sendCertificateEmail };
