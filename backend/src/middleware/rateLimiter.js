const rateLimit = require('express-rate-limit');

// Limitador general para toda la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intente mas tarde.',
  },
});

// Limitador estricto para autenticacion (login/refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de acceso, intente mas tarde.',
  },
});

module.exports = { apiLimiter, authLimiter };
