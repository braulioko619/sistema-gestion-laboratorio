const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/EquipmentController');
const StandardCalibrationHistoryController = require('../controllers/StandardCalibrationHistoryController');
const EquipmentImageController = require('../controllers/EquipmentImageController');
const EquipmentDocumentController = require('../controllers/EquipmentDocumentController');
const EquipmentLogController = require('../controllers/EquipmentLogController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadStandardCalibrationCertificate } = require('../middleware/uploadStandardCalibrationCertificate');
const { uploadCalibrationHistoryCsv } = require('../middleware/uploadCalibrationHistoryCsv');
const { uploadEquipmentImage } = require('../middleware/uploadEquipmentImage');
const { uploadEquipmentDocument } = require('../middleware/uploadEquipmentDocument');

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

// Imágenes referenciales del equipo (Control Metrológico): la consulta y la
// descarga están abiertas a cualquier autenticado, igual que el resto del
// módulo; solo se restringe la subida/eliminación.
router.get('/:id/images', EquipmentImageController.listImages);
router.post(
  '/:id/images',
  authorizeRole(ROLES_GESTION),
  uploadEquipmentImage.array('imagenes', 5),
  EquipmentImageController.uploadImages
);
router.get('/images/:imageId/file', EquipmentImageController.getImageFile);
router.put('/images/:imageId/principal', authorizeRole(ROLES_GESTION), EquipmentImageController.setPrincipal);
router.delete('/images/:imageId', authorizeRole(ROLES_GESTION), EquipmentImageController.deleteImage);

// Documentos (manuales, protocolos, fichas técnicas u otros exigidos por
// NCh-ISO/IEC 17025, la SEC o el ISP). Sin endpoint de borrado: registro
// permanente, igual criterio que los adjuntos de QualityRecord.
router.get('/:id/documents', EquipmentDocumentController.listDocuments);
router.post(
  '/:id/documents',
  authorizeRole(ROLES_GESTION),
  uploadEquipmentDocument.array('archivos', 5),
  EquipmentDocumentController.uploadDocuments
);
router.get('/documents/:documentId/download', EquipmentDocumentController.downloadDocument);

// Bitácora del instrumento con control de cambio: entradas inmutables, una
// corrección se registra como una entrada nueva (sin update/delete).
router.get('/:id/log', EquipmentLogController.listLogEntries);
router.post('/:id/log', authorizeRole(ROLES_GESTION), EquipmentLogController.createLogEntry);

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
