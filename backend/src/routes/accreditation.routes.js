const express = require('express');
const router = express.Router();
const AccreditationController = require('../controllers/AccreditationController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', AccreditationController.getAccreditationScopes);

module.exports = router;
