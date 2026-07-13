const express = require('express');
const router = express.Router();
const InternalAuditController = require('../controllers/InternalAuditController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

// Gestión del programa: jefatura y calidad
const ROLES_GESTION = ['administrador', 'jefe_laboratorio', 'personal_calidad'];

// Consulta: cualquier usuario autenticado
router.get('/', InternalAuditController.getAudits);
router.get('/summary', InternalAuditController.getAuditSummary);
router.get('/:id', InternalAuditController.getAuditById);

router.post('/', authorizeRole(ROLES_GESTION), InternalAuditController.createAudit);
router.put('/:id', authorizeRole(ROLES_GESTION), InternalAuditController.updateAudit);
router.post(
  '/:id/findings',
  authorizeRole(ROLES_GESTION),
  InternalAuditController.createFinding
);

module.exports = router;
