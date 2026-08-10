const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Consulta: cualquier usuario autenticado
router.get('/calibraciones', DashboardController.getCalibracionesDashboard);

module.exports = router;
