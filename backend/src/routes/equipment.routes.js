const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/EquipmentController');
const StandardCalibrationHistoryController = require('../controllers/StandardCalibrationHistoryController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadStandardCalibrationCertificate } = require('../middleware/uploadStandardCalibrationCertificate');
const { uploadCalibrationHistoryCsv } = require('../middleware/uploadCalibrationHistoryCsv');

router.use(authMiddleware);

const ROLES_GESTION = [
  'administrador',
  'jefe_laboratorio',
  'supervisor',
  'personal_calidad',
];

// Consulta: cualquier usuario autenticado
router.get('/', EquipmentController.getEquipment);
router.get('/alerts', EquipmentController.getEquipmentAlerts);
// Alertas de estabilidad (tarea 3.5): rutas estáticas, deben ir antes de
// '/:id' para que Express no las confunda con un id de equipo.
router.get('/stability-alerts', EquipmentController.getStabilityAlerts);
router.post('/stability-alerts/run', authorizeRole(ROLES_GESTION), EquipmentController.runStabilityAlertsJob);
router.get('/:id', EquipmentController.getEquipmentById);

// Gestión de equipos
router.post('/', authorizeRole(ROLES_GESTION), EquipmentController.createEquipment);
router.put('/:id', authorizeRole(ROLES_GESTION), EquipmentController.updateEquipment);

// Eventos: calibraciones, mantenimientos, verificaciones intermedias
router.post(
  '/:id/events',
  authorizeRole(ROLES_GESTION),
  EquipmentController.createEquipmentEvent
);

// Historial de calibración de patrones ("Historial_Patrones", tarea 3.3):
// consulta abierta a cualquier autenticado, gestión restringida igual que
// el resto del módulo de equipos.
router.get('/:equipmentId/calibration-history', StandardCalibrationHistoryController.getHistorialByEquipment);
router.post(
  '/:equipmentId/calibration-history',
  authorizeRole(ROLES_GESTION),
  uploadStandardCalibrationCertificate.single('archivo'),
  StandardCalibrationHistoryController.registrarCalibracion
);
router.post(
  '/:equipmentId/calibration-history/import-csv',
  authorizeRole(ROLES_GESTION),
  uploadCalibrationHistoryCsv.single('archivo'),
  StandardCalibrationHistoryController.importarCsv
);
router.get('/calibration-history/:id/certificado', StandardCalibrationHistoryController.downloadCertificado);

// Análisis de deriva (tarea 3.4): consulta abierta a cualquier autenticado,
// igual que el resto de las lecturas de este módulo.
router.get('/:equipmentId/drift-analysis', StandardCalibrationHistoryController.getDriftAnalysis);

// Carta de control (tarea 4.4): segunda vista de estabilidad, misma
// consulta abierta.
router.get('/:equipmentId/control-chart', StandardCalibrationHistoryController.getControlChart);

module.exports = router;
