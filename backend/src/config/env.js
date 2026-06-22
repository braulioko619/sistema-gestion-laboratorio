const logger = require('./logger');

const REQUIRED = ['JWT_SECRET', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const PRODUCTION_REQUIRED = ['JWT_REFRESH_SECRET', 'CORS_ORIGIN'];

function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);

  if (process.env.NODE_ENV === 'production') {
    missing.push(...PRODUCTION_REQUIRED.filter((k) => !process.env[k]));
  }

  if (missing.length > 0) {
    logger.error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn(
      'JWT_SECRET es demasiado corto. Usa al menos 32 caracteres aleatorios.'
    );
  }
}

module.exports = { validateEnv };
