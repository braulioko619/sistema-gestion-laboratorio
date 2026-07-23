const express = require('express');
const router = express.Router();
const WorkOrderController = require('../controllers/WorkOrderController');
const CalibrationCertificateController = require('../controllers/CalibrationCertificateController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadCalibrationCertificate } = require('../middleware/uploadCalibrationCertificate');

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
router.get('/:id', WorkOrderController.getWorkOrderById);

// Gestión de órdenes de trabajo
router.post('/', authorizeRole(ROLES_GESTION), WorkOrderController.createWorkOrder);
router.put('/:id/estado', authorizeRole(ROLES_GESTION), WorkOrderController.updateWorkOrderEstado);
router.post('/:id/items', authorizeRole(ROLES_GESTION), WorkOrderController.addWorkOrderItem);
router.put('/items/:itemId', authorizeRole(ROLES_GESTION), WorkOrderController.updateWorkOrderItem);

// Certificados de calibración
router.post(
  '/items/:itemId/certificate',
  authorizeRole(ROLES_GESTION),
  uploadCalibrationCertificate.single('archivo'),
  CalibrationCertificateController.uploadCertificate
);
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

module.exports = router;
