const express = require('express');
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  // Autenticación
  initAdmin,
  login,
  logout,
  verifyToken,
  // Usuarios
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  enableUsuario,
  // Roles
  getRoles,
  createRol,
  updateRol,
  deleteRol
} = require('../controllers/authController');

const router = express.Router();

// ============ VALIDACIONES ============

const loginValidation = [
  body('username').optional().notEmpty().withMessage('Usuario requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

const createUsuarioValidation = [
  body('username').notEmpty().withMessage('Usuario requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido'),
  body('roles').optional().isArray().withMessage('Roles debe ser un array')
];

const updateUsuarioValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('username').optional().notEmpty().withMessage('Usuario requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano'),
  body('roles').optional().isArray().withMessage('Roles debe ser un array')
];

const createRolValidation = [
  body('nombre').notEmpty().withMessage('Nombre del rol requerido'),
  body('descripcion').optional().isString()
];

const updateRolValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('nombre').optional().notEmpty().withMessage('Nombre del rol requerido'),
  body('descripcion').optional().isString()
];

// ============ RUTAS PÚBLICAS ============
router.post('/init-admin', initAdmin);
router.post('/login', loginValidation, validate, login);

// ============ RUTAS PROTEGIDAS ============
router.use(authMiddleware);

// Autenticación
router.post('/logout', logout);
router.get('/verify', verifyToken);

// ============ USUARIOS ============
router.get('/usuarios', checkRole(['ADMIN']), getUsuarios);
router.get('/usuarios/:id', checkRole(['ADMIN']), param('id').isInt(), validate, getUsuarioById);
router.post('/usuarios', checkRole(['ADMIN']), createUsuarioValidation, validate, createUsuario);
router.put('/usuarios/:id', checkRole(['ADMIN']), updateUsuarioValidation, validate, updateUsuario);
router.delete('/usuarios/:id', checkRole(['ADMIN']), param('id').isInt(), validate, deleteUsuario);
router.put('/usuarios/:id/enable', checkRole(['ADMIN']), param('id').isInt(), validate, enableUsuario);

// ============ ROLES ============
router.get('/roles', checkRole(['ADMIN']), getRoles);
router.post('/roles', checkRole(['ADMIN']), createRolValidation, validate, createRol);
router.put('/roles/:id', checkRole(['ADMIN']), updateRolValidation, validate, updateRol);
router.delete('/roles/:id', checkRole(['ADMIN']), param('id').isInt(), validate, deleteRol);

module.exports = router;