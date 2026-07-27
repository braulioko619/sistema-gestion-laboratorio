const express = require('express');
const router = express.Router();
const PersonnelController = require('../controllers/PersonnelController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

// Lectura: jefatura y calidad (expedientes con datos sensibles)
const ROLES_LECTURA = ['administrador', 'jefe_laboratorio', 'personal_calidad'];
// Escritura de expediente (formación, capacitación, etc.): solo administración y jefatura
const ROLES_ESCRITURA = ['administrador', 'jefe_laboratorio'];
// Gestión de la matriz de competencias (otorgar/revocar autorizaciones): tarea
// 2.5 agrega explícitamente a calidad, que hasta ahora solo tenía lectura.
const ROLES_GESTION_AUTORIZACIONES = ['administrador', 'jefe_laboratorio', 'personal_calidad'];

router.get('/', authorizeRole(ROLES_LECTURA), PersonnelController.getPersonnel);
router.get('/alerts', authorizeRole(ROLES_LECTURA), PersonnelController.getPersonnelAlerts);
router.get(
  '/:userId',
  authorizeRole(ROLES_LECTURA),
  PersonnelController.getPersonnelByUserId
);
router.get(
  '/:userId/authorized',
  authorizeRole(ROLES_LECTURA),
  PersonnelController.checkAuthorization
);

router.post(
  '/:userId/records',
  authorizeRole(ROLES_ESCRITURA),
  PersonnelController.createPersonnelRecord
);
router.post(
  '/:userId/authorizations',
  authorizeRole(ROLES_GESTION_AUTORIZACIONES),
  PersonnelController.createAuthorization
);
router.put(
  '/authorizations/:id/revoke',
  authorizeRole(ROLES_GESTION_AUTORIZACIONES),
  PersonnelController.revokeAuthorization
);

module.exports = router;
