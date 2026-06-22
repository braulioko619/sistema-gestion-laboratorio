const { User, Role } = require('../models');
const { generateToken, generateRefreshToken, comparePassword, hashPassword } = require('../utils/auth');
const logger = require('../config/logger');

// Registrar nuevo usuario
exports.register = async (req, res) => {
  try {
    const { email, password, nombre, apellido } = req.body;

    // Validar que no exista el usuario
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'El usuario ya existe',
        },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Obtener rol de usuario lectura por defecto
    const defaultRole = await Role.findOne({ where: { nombre: 'usuario_lectura' } });

    // Crear usuario
    const user = await User.create({
      email,
      password: hashedPassword,
      nombre,
      apellido,
      role_id: defaultRole.id,
    });

    logger.info(`[AUTH] Usuario registrado: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
      },
    });
  } catch (error) {
    logger.error(`[AUTH] Error en registro: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Error en el registro',
      },
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que exista el usuario
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'rol' }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciales inválidas',
        },
      });
    }

    // Validar contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciales inválidas',
        },
      });
    }

    // Actualizar último acceso
    await user.update({ ultimo_acceso: new Date() });

    // Generar tokens
    const token = generateToken(user.id, user.email, user.rol.nombre);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`[AUTH] Login exitoso: ${email}`);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol.nombre,
        },
      },
    });
  } catch (error) {
    logger.error(`[AUTH] Error en login: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Error en el login',
      },
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Token de refresco no proporcionado',
        },
      });
    }

    // Verificar y obtener usuario
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'rol' }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
      });
    }

    // Generar nuevo token
    const newToken = generateToken(user.id, user.email, user.rol.nombre);

    logger.info(`[AUTH] Token refrescado para usuario: ${user.email}`);

    res.json({
      success: true,
      message: 'Token refrescado',
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    logger.error(`[AUTH] Error en refresh token: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Error al refrescar token',
      },
    });
  }
};

// Logout (simplemente registrar la acción)
exports.logout = async (req, res) => {
  try {
    logger.info(`[AUTH] Logout: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout exitoso',
    });
  } catch (error) {
    logger.error(`[AUTH] Error en logout: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Error en el logout',
      },
    });
  }
};

// Obtener perfil del usuario actual
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
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
    logger.error(`[AUTH] Error obteniendo perfil: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROFILE_ERROR',
        message: 'Error obteniendo perfil',
      },
    });
  }
};
