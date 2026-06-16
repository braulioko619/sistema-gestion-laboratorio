const logger = require('../config/logger');

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

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
