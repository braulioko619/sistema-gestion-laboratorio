const express = require('express');
const router = express.Router();
const AssuranceController = require('../controllers/AssuranceController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadAssuranceRecord } = require('../middleware/uploadAssuranceRecord');

router.use(authMiddleware);

// Programar y ejecutar actividades es tarea técnica; consultarlas, no.
const ROLES_GESTION = [
  'administrador',
  'jefe_laboratorio',
  'supervisor',
  'personal_calidad',
];

// Consulta: cualquier usuario autenticado
router.get('/', AssuranceController.listActivities);
router.get('/summary', AssuranceController.getSummary);

// Programación de actividades
router.post('/', authorizeRole(ROLES_GESTION), AssuranceController.createActivity);
router.put('/:id', authorizeRole(ROLES_GESTION), AssuranceController.updateActivity);

// Evaluación de conformidad
router.post('/:id/evaluate', authorizeRole(ROLES_GESTION), AssuranceController.evaluateActivity);

// §7.7.3: levantar la no conformidad desde una actividad no conforme
router.post('/:id/nonconformity', authorizeRole(ROLES_GESTION), AssuranceController.createNonConformity);

// Registros (evidencia). Sin endpoint de borrado: registro permanente.
router.post(
  '/:id/records',
  authorizeRole(ROLES_GESTION),
  uploadAssuranceRecord.array('archivos', 5),
  AssuranceController.uploadRecords
);
router.get('/records/:recordId/download', AssuranceController.downloadRecord);
router.get('/records/:recordId/preview', AssuranceController.previewRecord);

module.exports = router;
