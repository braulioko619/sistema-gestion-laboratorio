const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Rutas absolutas (backend/logs), en vez de relativas al cwd del proceso:
// bajo un servicio de Windows (NSSM) el cwd depende de "AppDirectory", y si
// no coincide, Winston intentaba crear "logs/" en otro lugar y fallaba.
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      ({ timestamp, level, message, stack }) =>
        `${timestamp} [${level.toUpperCase()}] ${stack || message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'combined.log') }),
  ],
});

module.exports = logger;
