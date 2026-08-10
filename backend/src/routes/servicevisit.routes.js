const express = require('express');
const router = express.Router();
const ServiceVisitController = require('../controllers/ServiceVisitController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_GESTION = ['administrador', 'jefe_laboratorio', 'supervisor', 'personal_calidad'];

router.get('/', ServiceVisitController.getVisits);
router.get('/:id', ServiceVisitController.getVisitById);
router.post('/', authorizeRole(ROLES_GESTION), ServiceVisitController.createVisit);
router.put('/:id', authorizeRole(ROLES_GESTION), ServiceVisitController.updateVisit);

module.exports = router;
