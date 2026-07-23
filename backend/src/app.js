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
// helmet() configurado para desarrollo: desactivar headers que bloquean cross-origin
app.use(helmet({
  crossOriginResourcePolicy: false,        // Permite peticiones fetch cross-origin
  crossOriginOpenerPolicy: false,          // No bloquea ventanas cross-origin
  crossOriginEmbedderPolicy: false,        // No requiere CORP en recursos embebidos
  contentSecurityPolicy: false,            // CSP la maneja el frontend (React)
}));

// CORS antes de cualquier ruta para que los OPTIONS preflight funcionen.
// CORS_ORIGIN admite uno o varios orígenes separados por coma
// (ej: "https://sgl.tuempresa.com,https://sgl-staging.tuempresa.com").
// A diferencia de la versión anterior, los orígenes que no están en la
// lista se RECHAZAN siempre, también en desarrollo: si necesitas otro
// origen local, agrégalo explícitamente a CORS_ORIGIN en el .env.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (curl, Postman, llamadas same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      const corsError = new Error(`Origen no permitido por CORS: ${origin}`);
      corsError.status = 403;
      corsError.code = 'CORS_NOT_ALLOWED';
      callback(corsError);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Responder a preflight OPTIONS inmediatamente
app.options('*', cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('combined'));

// Rate limiting general
app.use('/api', apiLimiter);

// Auditoria (trazabilidad de cambios)
app.use(auditMiddleware);

// Health check endpoint (before rate limiting to always be accessible)
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

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
