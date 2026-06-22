const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Solo un administrador puede registrar nuevos usuarios
router.post(
  '/register',
  authMiddleware,
  authorizeRole(['administrador']),
  AuthController.register
);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', authLimiter, AuthController.refreshToken);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);

module.exports = router;
