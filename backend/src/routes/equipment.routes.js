const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/EquipmentController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

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

module.exports = router;
