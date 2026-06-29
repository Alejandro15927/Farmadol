const express = require('express');
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  registrarCompra,
  getCompras,
  getCompraById,
  updateEstadoCompra,
  getComprasByProveedor
} = require('../controllers/compraController');

const router = express.Router();

// Validaciones
const createProveedorValidation = [
  body('ruc').notEmpty().withMessage('RUC requerido').isLength({ min: 11, max: 11 }).withMessage('RUC debe tener 11 dígitos'),
  body('razon_social').notEmpty().withMessage('Razón social requerida').isLength({ max: 200 }),
  body('nombre_comercial').optional().isLength({ max: 200 }),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('contacto_email').optional().isEmail().withMessage('Email de contacto inválido')
];

const updateProveedorValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('ruc').notEmpty().withMessage('RUC requerido').isLength({ min: 11, max: 11 }).withMessage('RUC debe tener 11 dígitos'),
  body('razon_social').notEmpty().withMessage('Razón social requerida'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

const registrarCompraValidation = [
  body('numero_factura').notEmpty().withMessage('Número de factura requerido'),
  body('proveedor_id').isInt().withMessage('ID de proveedor inválido'),
  body('sucursal_id').isInt().withMessage('ID de sucursal inválido'),
  body('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('detalles.*.producto_id').isInt().withMessage('ID de producto inválido'),
  body('detalles.*.lote').notEmpty().withMessage('Lote requerido'),
  body('detalles.*.fecha_vencimiento').isDate().withMessage('Fecha de vencimiento inválida'),
  body('detalles.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('detalles.*.costo_unitario').isDecimal({ min: 0 }).withMessage('Costo unitario inválido')
];

const updateEstadoValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('estado').isIn(['pendiente', 'recibido', 'parcial', 'cancelado']).withMessage('Estado inválido')
];

// ============ RUTAS PROTEGIDAS ============
router.use(authMiddleware);

// ============ PROVEEDORES ============
router.get('/proveedores', getProveedores);
router.get('/proveedores/:id', param('id').isInt(), validate, getProveedorById);
router.post('/proveedores', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), createProveedorValidation, validate, createProveedor);
router.put('/proveedores/:id', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), updateProveedorValidation, validate, updateProveedor);
router.delete('/proveedores/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteProveedor);

// ============ COMPRAS ============
router.post('/compras', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), registrarCompraValidation, validate, registrarCompra);
router.get('/compras', getCompras);
router.get('/compras/:id', param('id').isInt(), validate, getCompraById);
router.put('/compras/:id/estado', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), updateEstadoValidation, validate, updateEstadoCompra);
router.get('/compras/proveedor/:proveedor_id', param('proveedor_id').isInt(), validate, getComprasByProveedor);

module.exports = router;