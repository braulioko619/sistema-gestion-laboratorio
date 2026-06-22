const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(authorizeRole(['administrador', 'jefe_laboratorio']));

router.get('/', AuditController.getAuditLogs);
router.get('/summary', AuditController.getAuditSummary);
router.get('/:id', AuditController.getAuditLogById);

module.exports = router;
