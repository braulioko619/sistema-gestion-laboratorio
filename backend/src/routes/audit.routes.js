const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(authorizeRole(['administrador', 'jefe_laboratorio']));

// UUID v4 con guiones: es el formato de AuditLog.id.
const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

router.get('/', AuditController.getAuditLogs);
// El frontend pide el listado como /audit/logs; se mantiene '/' por compatibilidad.
router.get('/logs', AuditController.getAuditLogs);
router.get('/summary', AuditController.getAuditSummary);
// El :id va restringido a UUID a propósito: sin esa restricción, cualquier
// subruta desconocida caía aquí, Postgres rechazaba el valor como UUID y la
// respuesta era un 500 en vez de un 404.
router.get(`/:id(${UUID})`, AuditController.getAuditLogById);

module.exports = router;
