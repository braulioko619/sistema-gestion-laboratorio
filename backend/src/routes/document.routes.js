const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { uploadDocumentAttachments } = require('../middleware/uploadDocumentAttachments');

router.use(authMiddleware);

router.get('/', DocumentController.getDocuments);
router.get(
  '/:id/authorizations',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  DocumentController.getProcedureAuthorizations
);
router.get('/:id/attachments/:attachmentId/download', DocumentController.downloadDocumentAttachment);
router.get('/:id', DocumentController.getDocumentById);

router.post(
  '/',
  authorizeRole([
    'administrador',
    'jefe_laboratorio',
    'supervisor',
    'personal_calidad',
  ]),
  uploadDocumentAttachments.array('archivos', 5),
  DocumentController.createDocument
);
router.put(
  '/:id',
  authorizeRole([
    'administrador',
    'jefe_laboratorio',
    'supervisor',
    'personal_calidad',
  ]),
  DocumentController.updateDocument
);
router.patch(
  '/:id/publish',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  DocumentController.publishDocument
);
router.post(
  '/:id/authorizations',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  DocumentController.grantProcedureAuthorization
);
router.patch(
  '/:id/authorizations/:authorizationId/revoke',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  DocumentController.revokeProcedureAuthorization
);
router.patch(
  '/:id/archive',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  DocumentController.archiveDocument
);

module.exports = router;
