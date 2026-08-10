const express = require('express');
const router = express.Router();
const SampleController = require('../controllers/SampleController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_GESTION = ['administrador', 'jefe_laboratorio', 'supervisor', 'personal_calidad'];

router.get('/', SampleController.getSamples);
router.get('/:id', SampleController.getSampleById);
router.post('/', authorizeRole(ROLES_GESTION), SampleController.createSample);
router.put('/:id', authorizeRole(ROLES_GESTION), SampleController.updateSample);
router.post('/:id/assign', authorizeRole(ROLES_GESTION), SampleController.assignToWorkOrder);
router.post('/:id/create-work-order', authorizeRole(ROLES_GESTION), SampleController.createWorkOrderFromSample);

module.exports = router;
