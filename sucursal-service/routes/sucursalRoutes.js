const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  enableSucursal,
  getSucursalesActivas,
  checkSucursalExists
} = require('../controllers/sucursalController');

const router = express.Router();

// ============ VALIDACIONES ============

const createSucursalValidation = [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('codigo').notEmpty().withMessage('Código requerido'),
  body('direccion').notEmpty().withMessage('Dirección requerida'),
  body('telefono').notEmpty().withMessage('Teléfono requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('horario_atencion').optional().isString(),
  body('encargado').optional().isString()
];

const updateSucursalValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('nombre').optional().notEmpty().withMessage('Nombre requerido'),
  body('codigo').optional().notEmpty().withMessage('Código requerido'),
  body('direccion').optional().notEmpty().withMessage('Dirección requerida'),
  body('telefono').optional().notEmpty().withMessage('Teléfono requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

// ============ RUTAS ============

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener sucursales (con filtros)
router.get('/', getSucursales);

// Obtener sucursales activas (para dropdowns)
router.get('/activas', getSucursalesActivas);

// Verificar existencia
router.get('/check/:id', param('id').isInt(), validate, checkSucursalExists);

// Obtener por ID
router.get('/:id', param('id').isInt(), validate, getSucursalById);

// Crear sucursal (ADMIN)
router.post('/', checkRole(['ADMIN']), createSucursalValidation, validate, createSucursal);

// Actualizar sucursal (ADMIN)
router.put('/:id', checkRole(['ADMIN']), updateSucursalValidation, validate, updateSucursal);

// Deshabilitar sucursal (ADMIN)
router.delete('/:id', checkRole(['ADMIN']), param('id').isInt(), validate, deleteSucursal);

// Habilitar sucursal (ADMIN)
router.put('/:id/enable', checkRole(['ADMIN']), param('id').isInt(), validate, enableSucursal);

module.exports = router;