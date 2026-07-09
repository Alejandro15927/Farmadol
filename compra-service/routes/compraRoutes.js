const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  // Proveedores
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  enableProveedor,
  getProveedoresActivos,
  // Compras
  registrarCompra,
  getCompras,
  getCompraById,
  updateCompra,
  anularCompra,
  confirmarRecepcion,
  getComprasByProveedor,
  getComprasDelDia,
  // Estadísticas
  getEstadisticas
} = require('../controllers/compraController');

const router = express.Router();

// ============ VALIDACIONES ============

const createProveedorValidation = [
  body('ruc').notEmpty().withMessage('RUC requerido'),
  body('razon_social').notEmpty().withMessage('Razón social requerida'),
  body('email').optional().isEmail().withMessage('Email inválido')
];

const updateProveedorValidation = [
  param('id').isInt().withMessage('ID inválido'),
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

const updateCompraValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('estado').optional().isIn(['pendiente', 'recibido', 'parcial', 'cancelado']).withMessage('Estado inválido')
];

// ============ RUTAS ============

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============ PROVEEDORES ============
router.get('/proveedores', getProveedores);
router.get('/proveedores/activos', getProveedoresActivos);
router.get('/proveedores/:id', param('id').isInt(), validate, getProveedorById);
router.post('/proveedores', checkRole(['ADMIN', 'GERENTE']), createProveedorValidation, validate, createProveedor);
router.put('/proveedores/:id', checkRole(['ADMIN', 'GERENTE']), updateProveedorValidation, validate, updateProveedor);
router.delete('/proveedores/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteProveedor);
router.put('/proveedores/:id/enable', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, enableProveedor);

// ============ COMPRAS ============
router.post('/', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), registrarCompraValidation, validate, registrarCompra);
router.get('/', getCompras);
router.get('/dia/resumen', getComprasDelDia);
router.get('/proveedor/:proveedor_id', param('proveedor_id').isInt(), validate, getComprasByProveedor);
router.get('/estadisticas', checkRole(['ADMIN', 'GERENTE']), getEstadisticas);
router.get('/:id', param('id').isInt(), validate, getCompraById);

router.put('/:id', checkRole(['ADMIN', 'GERENTE']), updateCompraValidation, validate, updateCompra);
router.put('/:id/anular', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, anularCompra);
router.put('/:id/confirmar', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), param('id').isInt(), validate, confirmarRecepcion);

module.exports = router;