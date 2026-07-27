const express = require('express');
const router = express.Router();
const CalibrationFormTemplateController = require('../controllers/CalibrationFormTemplateController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

// Gestión de plantillas de formulario: mismo criterio que plantillas Excel
// (tarea 2.1) — solo calidad y administración.
const ROLES_GESTION_PLANTILLAS = ['administrador', 'personal_calidad'];

// Consulta: cualquier usuario autenticado (los técnicos necesitan ver qué
// plantillas existen para capturar datos, aunque no puedan gestionarlas).
router.get('/', CalibrationFormTemplateController.getTemplates);
router.get('/:id', CalibrationFormTemplateController.getTemplateById);

router.post('/', authorizeRole(ROLES_GESTION_PLANTILLAS), CalibrationFormTemplateController.createTemplate);
router.post('/:id/versions', authorizeRole(ROLES_GESTION_PLANTILLAS), CalibrationFormTemplateController.createVersion);
router.patch(
  '/:id/versions/:versionId/vigente',
  authorizeRole(ROLES_GESTION_PLANTILLAS),
  CalibrationFormTemplateController.marcarVersionVigente
);
router.patch('/:id/obsoletar', authorizeRole(ROLES_GESTION_PLANTILLAS), CalibrationFormTemplateController.obsoletarTemplate);

module.exports = router;
