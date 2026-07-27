const express = require('express');
const router = express.Router();
const WorkOrderController = require('../controllers/WorkOrderController');
const CalibrationCertificateController = require('../controllers/CalibrationCertificateController');
const CalibrationDataFileController = require('../controllers/CalibrationDataFileController');
const CalibrationFormEntryController = require('../controllers/CalibrationFormEntryController');
const UncertaintyEngineController = require('../controllers/UncertaintyEngineController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadCalibrationCertificate } = require('../middleware/uploadCalibrationCertificate');
const { uploadCalibrationDataFile } = require('../middleware/uploadCalibrationDataFile');

router.use(authMiddleware);

const ROLES_GESTION = [
  'administrador',
  'jefe_laboratorio',
  'supervisor',
  'personal_calidad',
];
// Emitir/enviar certificados: solo administración y jefatura
const ROLES_CERTIFICADO = ['administrador', 'jefe_laboratorio'];

// Consulta: cualquier usuario autenticado
router.get('/', WorkOrderController.getWorkOrders);
router.get('/certificates/:id/download', CalibrationCertificateController.downloadCertificate);
// Bandeja de facturación: rutas literales, deben ir antes de '/:id'
router.get('/billing-queue', authorizeRole(ROLES_GESTION), WorkOrderController.getBillingQueue);
router.get('/billing-queue/export', authorizeRole(ROLES_GESTION), WorkOrderController.exportBillingQueueCsv);
router.get('/:id', WorkOrderController.getWorkOrderById);

// Gestión de órdenes de trabajo
router.post('/', authorizeRole(ROLES_GESTION), WorkOrderController.createWorkOrder);
router.put('/:id/estado', authorizeRole(ROLES_GESTION), WorkOrderController.updateWorkOrderEstado);
router.patch('/:id/facturada-externamente', authorizeRole(ROLES_GESTION), WorkOrderController.markFacturadaExternamente);
router.post('/:id/items', authorizeRole(ROLES_GESTION), WorkOrderController.addWorkOrderItem);
router.put('/items/:itemId', authorizeRole(ROLES_GESTION), WorkOrderController.updateWorkOrderItem);

// Certificados de calibración
router.post(
  '/items/:itemId/certificate',
  authorizeRole(ROLES_GESTION),
  uploadCalibrationCertificate.single('archivo'),
  CalibrationCertificateController.uploadCertificate
);
router.post(
  '/items/:itemId/certificate/generate',
  authorizeRole(ROLES_GESTION),
  CalibrationCertificateController.generateCertificate
);
router.get(
  '/certificates/:id/issuance-check',
  authorizeRole(ROLES_GESTION),
  CalibrationCertificateController.getIssuanceCheck
);
// Firmar: cualquier autenticado puede intentarlo, la elegibilidad real
// (técnico responsable / supervisor+ / signatario_inn si acreditado) la
// decide el controlador, igual que el guardia de "acreditado" en items (1.2).
router.post('/certificates/:id/sign', CalibrationCertificateController.signCertificate);
router.put(
  '/certificates/:id/estado',
  authorizeRole(ROLES_CERTIFICADO),
  CalibrationCertificateController.updateCertificateEstado
);
router.post(
  '/certificates/:id/send',
  authorizeRole(ROLES_CERTIFICADO),
  CalibrationCertificateController.sendCertificate
);
// Enmienda (tarea 2.9): mismo nivel de autorización que emitir/enviar, ya
// que equivale a re-emitir un documento controlado.
router.post(
  '/certificates/:id/amend',
  authorizeRole(ROLES_CERTIFICADO),
  CalibrationCertificateController.amendCertificate
);

// Raw data de calibración (tarea 2.3): histórico append-only por ítem
router.get('/items/:itemId/data-files', CalibrationDataFileController.getDataFilesForItem);
router.post(
  '/items/:itemId/data-files',
  authorizeRole(ROLES_GESTION),
  uploadCalibrationDataFile.single('archivo'),
  CalibrationDataFileController.uploadDataFile
);
router.get('/data-files/:id/download', CalibrationDataFileController.downloadDataFile);
router.post('/data-files/:id/verify', authorizeRole(ROLES_GESTION), CalibrationDataFileController.verifyDataFile);

// Captura directa por formulario dinámico (tarea 3.2): histórico
// append-only por ítem, igual que data-files; confirmado = inmutable
// (bloqueado dentro del propio controlador, no aquí).
router.get('/items/:itemId/form-entries', CalibrationFormEntryController.getEntriesForItem);
router.post('/items/:itemId/form-entries', authorizeRole(ROLES_GESTION), CalibrationFormEntryController.createEntry);
router.put('/form-entries/:id', authorizeRole(ROLES_GESTION), CalibrationFormEntryController.updateEntry);
router.post('/form-entries/:id/confirm', authorizeRole(ROLES_GESTION), CalibrationFormEntryController.confirmEntry);

// Motor de incertidumbre GUM (tarea 4.1, piloto Pie de Metros): mismos
// roles que el resto de escrituras sobre el ítem.
router.post('/items/:itemId/calculate-uncertainty', authorizeRole(ROLES_GESTION), UncertaintyEngineController.calculateUncertainty);

// Patrones usados en la calibración de un ítem (tarea 2.6: trazabilidad)
router.post('/items/:itemId/patrones', authorizeRole(ROLES_GESTION), WorkOrderController.addPatronToItem);
router.delete('/items/:itemId/patrones/:equipmentId', authorizeRole(ROLES_GESTION), WorkOrderController.removePatronFromItem);

module.exports = router;
