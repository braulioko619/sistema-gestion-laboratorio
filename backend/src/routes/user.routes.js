const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authMiddleware, authorizeRole } = require('../middleware/auth');

router.use(authMiddleware);

router.get(
  '/',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  UserController.getUsers
);
router.get(
  '/:id',
  authorizeRole(['administrador', 'jefe_laboratorio']),
  UserController.getUserById
);
router.put('/:id', authorizeRole(['administrador']), UserController.updateUser);
router.patch(
  '/:id/state',
  authorizeRole(['administrador']),
  UserController.changeUserState
);

module.exports = router;
