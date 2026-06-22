const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { auditMiddleware } = require('./middleware/audit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Seguridad y utilidades base
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

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
