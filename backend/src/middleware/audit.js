const logger = require('../config/logger');

// Middleware para registrar auditoría
const auditMiddleware = (req, res, next) => {
  // Capturar el original send
  const originalSend = res.send;

  res.send = function (data) {
    // Registrar solo cambios importantes (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const auditLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        user_id: req.user?.id || 'anonymous',
        user_email: req.user?.email || 'anonymous',
        body: sanitizeData(req.body),
        ip_address: req.ip,
        status: res.statusCode,
      };

      logger.info(`[AUDIT] ${JSON.stringify(auditLog)}`);
    }

    // Llamar al send original
    return originalSend.call(this, data);
  };

  next();
};

// Función para sanitizar datos sensibles
const sanitizeData = (data) => {
  if (!data) return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

module.exports = {
  auditMiddleware,
};
