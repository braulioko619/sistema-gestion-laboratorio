const express = require('express');
const router = express.Router();
const NonConformityController = require('../controllers/NonConformityController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

// Cualquier usuario autenticado puede consultar
router.get('/', NonConformityController.getNonConformities);
router.get('/summary', NonConformityController.getNonConformitySummary);
router.get('/:id', NonConformityController.getNonConformityById);

// Cualquier rol operativo puede reportar una NC
router.post(
  '/',
  authorizeRole([
    'administrador',
    'jefe_laboratorio',
    'supervisor',
    'personal_calidad',
  ]),
  NonConformityController.createNonConformity
);

// Tratamiento: análisis de causa raíz, acción correctiva, responsable
router.put(
  '/:id',
  authorizeRole([
    'administrador',
    'jefe_laboratorio',
    'supervisor',
    'personal_calidad',
  ]),
  NonConformityController.updateNonConformity
);

// Verificación de eficacia y cierre: solo jefatura y calidad
router.post(
  '/:id/verify',
  authorizeRole(['administrador', 'jefe_laboratorio', 'personal_calidad']),
  NonConformityController.verifyNonConformity
);

module.exports = router;
