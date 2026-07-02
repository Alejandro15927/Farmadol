const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  getMetodosPago,
  registrarVenta,
  getVentas,
  getVentaById,
  anularVenta,
  getVentasByCliente,
  getVentasDelDia,
  getProductosMasVendidos
} = require('../controllers/ventaController');

const router = express.Router();

// Validaciones
const createClienteValidation = [
  body('tipo_documento').isIn(['DNI', 'RUC', 'CE', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
  body('numero_documento').notEmpty().withMessage('Número de documento requerido'),
  body('nombres').notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').notEmpty().withMessage('Apellidos requeridos'),
  body('email').optional().isEmail().withMessage('Email inválido')
];

const updateClienteValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('tipo_documento').isIn(['DNI', 'RUC', 'CE', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
  body('numero_documento').notEmpty().withMessage('Número de documento requerido'),
  body('nombres').notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').notEmpty().withMessage('Apellidos requeridos'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

const registrarVentaValidation = [
  body('sucursal_id').isInt().withMessage('ID de sucursal inválido'),
  body('metodo_pago_id').isInt().withMessage('ID de método de pago inválido'),
  body('cliente_id').optional().isInt().withMessage('ID de cliente inválido'),
  body('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('detalles.*.producto_id').isInt().withMessage('ID de producto inválido'),
  body('detalles.*.inventario_id').isInt().withMessage('ID de inventario inválido'),
  body('detalles.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('detalles.*.precio_unitario').isDecimal({ min: 0 }).withMessage('Precio unitario inválido'),
  body('detalles.*.lote').optional().isString(),
  body('detalles.*.fecha_vencimiento').optional({ values: 'falsy' }).isDate().withMessage('Fecha de vencimiento inválida')
];

const anularVentaValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('observaciones').optional().isString()
];

// ============ RUTAS PROTEGIDAS ============
router.use(authMiddleware);

// ============ CLIENTES ============
router.get('/clientes', getClientes);
router.get('/clientes/:id', param('id').isInt(), validate, getClienteById);
router.post('/clientes', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), createClienteValidation, validate, createCliente);
router.put('/clientes/:id', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), updateClienteValidation, validate, updateCliente);

// ============ MÉTODOS DE PAGO ============
router.get('/metodos-pago', getMetodosPago);

// ============ VENTAS ============
router.post('/ventas', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), registrarVentaValidation, validate, registrarVenta);
router.get('/ventas', getVentas);
router.get('/ventas/:id', param('id').isInt(), validate, getVentaById);
router.put('/ventas/:id/anular', checkRole(['ADMIN', 'GERENTE']), anularVentaValidation, validate, anularVenta);
router.get('/ventas/cliente/:cliente_id', param('cliente_id').isInt(), validate, getVentasByCliente);
router.get('/ventas/dia/resumen', getVentasDelDia);
router.get('/ventas/top/productos', getProductosMasVendidos);

module.exports = router;