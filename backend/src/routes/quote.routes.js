const express = require('express');
const router = express.Router();
const QuoteController = require('../controllers/QuoteController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

const ROLES_GESTION = ['administrador', 'jefe_laboratorio', 'supervisor', 'personal_calidad'];

router.get('/', QuoteController.getQuotes);
router.get('/:id', QuoteController.getQuoteById);
router.get('/:id/history', QuoteController.getQuoteHistory);
router.get('/:id/pdf', QuoteController.downloadQuotePdf);

router.post('/', authorizeRole(ROLES_GESTION), QuoteController.createQuote);
router.put('/:id', authorizeRole(ROLES_GESTION), QuoteController.updateQuote);
router.put('/:id/estado', authorizeRole(ROLES_GESTION), QuoteController.updateQuoteEstado);

module.exports = router;
