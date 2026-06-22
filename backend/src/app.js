const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { auditMiddleware } = require('./middleware/audit');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Confianza en proxy (necesario para rate-limit detras de proxy/balanceador)
app.set('trust proxy', 1);

// Seguridad y utilidades base
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('combined'));

// Rate limiting general
app.use('/api', apiLimiter);

// Auditoria (trazabilidad de cambios)
app.use(auditMiddleware);

// Rutas de la API
app.use('/api', routes);

// Ruta raiz informativa
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Gestion de Laboratorio',
    docs: '/api/health',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

// Manejo centralizado de errores
app.use(errorHandler);

module.exports = app;
