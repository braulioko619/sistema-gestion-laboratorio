const logger = require('../config/logger');

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  const uploadErrors = {
    LIMIT_FILE_SIZE: 'Cada archivo puede pesar como máximo 10 MB',
    LIMIT_FILE_COUNT: 'Se pueden adjuntar como máximo 5 archivos',
    LIMIT_UNEXPECTED_FILE: 'Campo de archivo no válido',
  };
  const status = err.status || (uploadErrors[err.code] ? 400 : 500);
  const message = uploadErrors[err.code] || err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};

module.exports = errorHandler;
