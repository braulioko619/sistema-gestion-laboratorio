const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const ClientInstrumentController = require('../controllers/ClientInstrumentController');
const ClientContactController = require('../controllers/ClientContactController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_GESTION = [
  'administrador',
  'jefe_laboratorio',
  'supervisor',
  'personal_calidad',
];

// Consulta: cualquier usuario autenticado
router.get('/instruments/alerts', ClientInstrumentController.getInstrumentAlerts);
router.get('/', ClientController.getClients);
router.get('/:clientId/instruments', ClientInstrumentController.getClientInstruments);
router.get('/:clientId/instruments/:id', ClientInstrumentController.getClientInstrumentById);
router.get('/:id', ClientController.getClientById);

// Gestión de clientes e instrumentos
router.post('/', authorizeRole(ROLES_GESTION), ClientController.createClient);
router.put('/:id', authorizeRole(ROLES_GESTION), ClientController.updateClient);
router.post(
  '/:clientId/instruments',
  authorizeRole(ROLES_GESTION),
  ClientInstrumentController.createClientInstrument
);
router.put(
  '/instruments/:id',
  authorizeRole(ROLES_GESTION),
  ClientInstrumentController.updateClientInstrument
);

// Direcciones del cliente (puede haber más de una, diferenciadas por "tipo")
router.post('/:clientId/addresses', authorizeRole(ROLES_GESTION), ClientContactController.createAddress);
router.put('/addresses/:id', authorizeRole(ROLES_GESTION), ClientContactController.updateAddress);
router.delete('/addresses/:id', authorizeRole(ROLES_GESTION), ClientContactController.deleteAddress);

// Contactos del cliente (facturación, certificados, comercial, órdenes de compra, etc.)
router.post('/:clientId/contacts', authorizeRole(ROLES_GESTION), ClientContactController.createContact);
router.put('/contacts/:id', authorizeRole(ROLES_GESTION), ClientContactController.updateContact);
router.delete('/contacts/:id', authorizeRole(ROLES_GESTION), ClientContactController.deleteContact);

module.exports = router;
