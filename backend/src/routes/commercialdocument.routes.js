const express = require('express');
const router = express.Router();
const CommercialDocumentController = require('../controllers/CommercialDocumentController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadCommercialDocument } = require('../middleware/uploadCommercialDocument');

router.use(authMiddleware);

const ROLES_GESTION = ['administrador', 'jefe_laboratorio', 'supervisor', 'personal_calidad'];

router.get('/', CommercialDocumentController.getCommercialDocuments);
router.get('/:id', CommercialDocumentController.getCommercialDocumentById);
router.get('/:id/download', CommercialDocumentController.downloadCommercialDocument);

router.post(
  '/',
  authorizeRole(ROLES_GESTION),
  uploadCommercialDocument.single('archivo'),
  CommercialDocumentController.createCommercialDocument
);
router.put('/:id', authorizeRole(ROLES_GESTION), CommercialDocumentController.updateCommercialDocument);

module.exports = router;
