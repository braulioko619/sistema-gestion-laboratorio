const express = require('express');
const router = express.Router();
const ChecklistTemplateController = require('../controllers/ChecklistTemplateController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_GESTION_PLANTILLA = ['administrador', 'jefe_laboratorio'];

router.get('/', ChecklistTemplateController.getChecklistTemplate);
router.post('/', authorizeRole(ROLES_GESTION_PLANTILLA), ChecklistTemplateController.createChecklistItem);
router.put('/:id', authorizeRole(ROLES_GESTION_PLANTILLA), ChecklistTemplateController.updateChecklistItem);

module.exports = router;
