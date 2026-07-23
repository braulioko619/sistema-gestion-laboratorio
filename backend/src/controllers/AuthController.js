const { User, Role } = require('../models');
const { generateToken, generateRefreshToken, comparePassword, hashPassword } = require('../utils/auth');
const logger = require('../config/logger');
const { getMsalClient, GRAPH_SCOPES, REDIRECT_URI } = require('../config/msal');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Redirige a Microsoft para iniciar el login SSO
exports.microsoftLogin = async (req, res) => {
  const msalClient = getMsalClient();
  if (!msalClient) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SSO_NOT_CONFIGURED',
        message: 'El login con Microsoft no está configurado en este servidor',
      },
    });
  }

  try {
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: GRAPH_SCOPES,
      redirectUri: REDIRECT_URI,
    });
    res.redirect(authUrl);
  } catch (error) {
    logger.error(`[AUTH] Error generando URL de Microsoft: ${error.message}`);
    res.redirect(`${FRONTEND_URL}/login?error=sso_error`);
  }
};

// Callback: intercambia el code, obtiene el perfil de Graph y emite el JWT propio
exports.microsoftCallback = async (req, res) => {
  const msalClient = getMsalClient();
  if (!msalClient) {
    return res.redirect(`${FRONTEND_URL}/login?error=sso_not_configured`);
  }

  try {
    const tokenResponse = await msalClient.acquireTokenByCode({
      code: req.query.code,
      scopes: GRAPH_SCOPES,
      redirectUri: REDIRECT_URI,
    });

    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
    });
    if (!graphRes.ok) {
      throw new Error(`Graph API respondió ${graphRes.status}`);
    }
    const profile = await graphRes.json();
    const email = (profile.mail || profile.userPrincipalName || '').toLowerCase();

    if (!email) {
      throw new Error('La cuenta de Microsoft no tiene un email asociado');
    }

    let user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'rol' }] });

    if (!user) {
      const defaultRole = await Role.findOne({ where: { nombre: 'usuario_lectura' } });
      user = await User.create({
        email,
        password: null,
        nombre: profile.givenName || profile.displayName || email,
        apellido: profile.surname || '',
        role_id: defaultRole.id,
        auth_provider: 'microsoft',
      });
      user = await User.findByPk(user.id, { include: [{ model: Role, as: 'rol' }] });
    }

    await user.update({ ultimo_acceso: new Date() });

    const token = generateToken(user.id, user.email, user.rol.nombre);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`[AUTH] Login SSO exitoso: ${email}`);

    res.redirect(
      `${FRONTEND_URL}/sso-callback?token=${encodeURIComponent(token)}&refreshToken=${encodeURIComponent(refreshToken)}`
    );
  } catch (error) {
    logger.error(`[AUTH] Error en callback de Microsoft: ${error.message}`);
    res.redirect(`${FRONTEND_URL}/login?error=sso_error`);
  }
};

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
