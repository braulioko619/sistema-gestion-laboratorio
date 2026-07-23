const express = require('express');
const router = express.Router();
const QualityController = require('../controllers/QualityController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadQualityAttachments } = require('../middleware/uploadQualityAttachments');

router.use(authMiddleware);

const ROLES_REGISTRO = [
  'administrador',
  'jefe_laboratorio',
  'supervisor',
  'personal_calidad',
];

// Rutas documentadas en docs/API.md (las que usa el frontend)
router.get('/records', QualityController.getQualityRecords);
router.post('/records', authorizeRole(ROLES_REGISTRO), uploadQualityAttachments.array('archivos', 5), QualityController.createQualityRecord);
router.get('/records/:id/attachments/:attachmentId/download', QualityController.downloadQualityRecordAttachment);
router.get('/indicators', QualityController.getQualityIndicators);
router.get('/summary', QualityController.getQualitySummary);

// Rutas legadas (compatibilidad con clientes previos)
router.get('/', QualityController.getQualityRecords);
router.post('/', authorizeRole(ROLES_REGISTRO), uploadQualityAttachments.array('archivos', 5), QualityController.createQualityRecord);

module.exports = router;
