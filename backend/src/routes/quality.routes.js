const express = require('express');
const router = express.Router();
const QualityController = require('../controllers/QualityController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_REGISTRO = [
  'administrador',
  'jefe_laboratorio',
  'supervisor',
  'personal_calidad',
];

// Rutas documentadas en docs/API.md (las que usa el frontend)
router.get('/records', QualityController.getQualityRecords);
router.post('/records', authorizeRole(ROLES_REGISTRO), QualityController.createQualityRecord);
router.get('/indicators', QualityController.getQualityIndicators);
router.get('/summary', QualityController.getQualitySummary);

// Rutas legadas (compatibilidad con clientes previos)
router.get('/', QualityController.getQualityRecords);
router.post('/', authorizeRole(ROLES_REGISTRO), QualityController.createQualityRecord);

module.exports = router;
