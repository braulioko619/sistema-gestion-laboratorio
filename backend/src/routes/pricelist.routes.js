const express = require('express');
const router = express.Router();
const PriceListController = require('../controllers/PriceListController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_TARIFARIO = ['administrador', 'jefe_laboratorio'];

router.get('/', PriceListController.getPriceListItems);
router.post('/', authorizeRole(ROLES_TARIFARIO), PriceListController.createPriceListItem);
router.put('/:id', authorizeRole(ROLES_TARIFARIO), PriceListController.updatePriceListItem);

module.exports = router;
