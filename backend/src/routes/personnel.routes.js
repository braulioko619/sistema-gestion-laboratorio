const express = require('express');
const router = express.Router();
const PersonnelController = require('../controllers/PersonnelController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

// Lectura: jefatura y calidad (expedientes con datos sensibles)
const ROLES_LECTURA = ['administrador', 'jefe_laboratorio', 'personal_calidad'];
// Escritura: solo administración y jefatura
const ROLES_ESCRITURA = ['administrador', 'jefe_laboratorio'];

router.get('/', authorizeRole(ROLES_LECTURA), PersonnelController.getPersonnel);
router.get('/alerts', authorizeRole(ROLES_LECTURA), PersonnelController.getPersonnelAlerts);
router.get(
  '/:userId',
  authorizeRole(ROLES_LECTURA),
  PersonnelController.getPersonnelByUserId
);

router.post(
  '/:userId/records',
  authorizeRole(ROLES_ESCRITURA),
  PersonnelController.createPersonnelRecord
);
router.post(
  '/:userId/authorizations',
  authorizeRole(ROLES_ESCRITURA),
  PersonnelController.createAuthorization
);
router.put(
  '/authorizations/:id/revoke',
  authorizeRole(ROLES_ESCRITURA),
  PersonnelController.revokeAuthorization
);

module.exports = router;
