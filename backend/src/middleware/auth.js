const { verifyToken } = require('../utils/auth');
const logger = require('../config/logger');

// Middleware para verificar JWT
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token provided',
        },
      });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

// Middleware para verificar rol
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorizeRole,
};
