const express = require('express');
const router = express.Router();
const QualityController = require('../controllers/QualityController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', QualityController.getQualityRecords);
router.get('/summary', QualityController.getQualitySummary);
router.post(
  '/',
  authorizeRole([
    'administrador',
    'jefe_laboratorio',
    'supervisor',
    'personal_calidad',
  ]),
  QualityController.createQualityRecord
);

module.exports = router;
