const express = require('express');
const router = express.Router();
const SoftwareValidationController = require('../controllers/SoftwareValidationController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(authorizeRole(['administrador']));

router.get('/', SoftwareValidationController.getSoftwareValidations);
router.get('/:id', SoftwareValidationController.getSoftwareValidationById);
router.post('/', SoftwareValidationController.createSoftwareValidation);
router.patch('/:id/approve', SoftwareValidationController.approveSoftwareValidation);

module.exports = router;
