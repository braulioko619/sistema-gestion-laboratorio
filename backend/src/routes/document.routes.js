const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', DocumentController.getDocuments);
router.get('/:id', DocumentController.getDocumentById);

router.post(
  '/',
  authorizeRole([
    'administrador',
    'jefe_laboratorio',
    'supervisor',
    'personal_calidad',
  ]),
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
router.patch(
  '/:id/archive',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  DocumentController.archiveDocument
);

module.exports = router;
