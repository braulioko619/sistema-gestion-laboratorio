const express = require('express');
const router = express.Router();
const ExcelTemplateController = require('../controllers/ExcelTemplateController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadExcelTemplate } = require('../middleware/uploadExcelTemplate');

router.use(authMiddleware);

// Gestión de plantillas: solo calidad y administración (D-tarea 2.1)
const ROLES_GESTION_PLANTILLAS = ['administrador', 'personal_calidad'];

// Consulta: cualquier usuario autenticado (técnicos necesitan ver qué plantillas existen)
router.get('/', ExcelTemplateController.getTemplates);
router.get('/:id', ExcelTemplateController.getTemplateById);
// Descarga controlada de la versión vigente (tarea 2.2): abierta a cualquier
// autenticado, igual que la consulta — los técnicos la necesitan para calibrar.
router.get('/:id/download', ExcelTemplateController.downloadCurrentVersion);

router.post('/', authorizeRole(ROLES_GESTION_PLANTILLAS), ExcelTemplateController.createTemplate);
router.post(
  '/:id/versions',
  authorizeRole(ROLES_GESTION_PLANTILLAS),
  uploadExcelTemplate.single('archivo'),
  ExcelTemplateController.uploadVersion
);
router.patch(
  '/:id/versions/:versionId/vigente',
  authorizeRole(ROLES_GESTION_PLANTILLAS),
  ExcelTemplateController.marcarVersionVigente
);
router.patch('/:id/obsoletar', authorizeRole(ROLES_GESTION_PLANTILLAS), ExcelTemplateController.obsoletarTemplate);

module.exports = router;
