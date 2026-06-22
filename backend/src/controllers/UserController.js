const { User, Role } = require('../models');
const { hashPassword } = require('../utils/auth');
const logger = require('../config/logger');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const { role, estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;

    let include = [{ model: Role, as: 'rol' }];
    if (role) {
      include = [
        {
          model: Role,
          as: 'rol',
          where: { nombre: role },
        },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['password'] },
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error(`[USER] Error obteniendo usuarios: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_ERROR',
        message: 'Error obteniendo usuarios',
      },
    });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'rol' }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(`[USER] Error obteniendo usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: 'Error obteniendo usuario',
      },
    });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, role_id, estado } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    await user.update({
      nombre: nombre || user.nombre,
      apellido: apellido || user.apellido,
      email: email || user.email,
      role_id: role_id || user.role_id,
      estado: estado || user.estado,
    });

    logger.info(`[USER] Usuario actualizado: ${id}`);

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: user,
    });
  } catch (error) {
    logger.error(`[USER] Error actualizando usuario: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_USER_ERROR',
        message: 'Error actualizando usuario',
      },
    });
  }
};

// Cambiar estado de usuario
exports.changeUserState = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Estado inválido',
        },
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    await user.update({ estado });

    logger.info(`[USER] Estado de usuario actualizado: ${id} -> ${estado}`);

    res.json({
      success: true,
      message: `Usuario ${estado} correctamente`,
      data: user,
    });
  } catch (error) {
    logger.error(`[USER] Error cambiando estado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_STATE_ERROR',
        message: 'Error cambiando estado del usuario',
      },
    });
  }
};
