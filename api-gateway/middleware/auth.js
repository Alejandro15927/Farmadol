// api-gateway/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'farmadol_secret_key_2024';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/init-admin',
  '/health',
  '/'
];

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  // ✅ Verificar usando req.originalUrl (la ruta completa original)
  const originalUrl = req.originalUrl || req.url;
  
  // ✅ Verificar si es una ruta pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Comparación exacta con la ruta original
    if (originalUrl === route) return true;
    if (originalUrl.startsWith(route + '?')) return true; // Con query params
    // Si la ruta pública termina con /*, verificar inicio
    if (route.endsWith('/*')) {
      const baseRoute = route.replace('/*', '');
      return originalUrl.startsWith(baseRoute);
    }
    return false;
  });

  // ✅ También verificar con req.path (sin query params)
  const isPublicPath = PUBLIC_ROUTES.some(route => {
    if (req.path === route) return true;
    if (route.endsWith('/*')) {
      const baseRoute = route.replace('/*', '');
      return req.path.startsWith(baseRoute);
    }
    return false;
  });

  if (isPublicRoute || isPublicPath) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado',
      code: 'TOKEN_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token inválido',
      code: 'TOKEN_INVALID'
    });
  }
};

// Middleware para verificar roles específicos
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_roles: userRoles
      });
    }

    next();
  };
};

module.exports = { authMiddleware, checkRole };