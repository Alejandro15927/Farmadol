const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  addDireccion,
  getDirecciones,
  registrarCompra,
  getHistorialCompras,
  actualizarFrecuencia,
  getProductosFrecuentes,
  getEstadisticas,
  getClientesFrecuentes,
  buscarPorDocumento
} = require('../controllers/clienteController');

const router = express.Router();

// Validaciones
const createClienteValidation = [
  body('tipo_documento').isIn(['DNI', 'RUC', 'CE', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
  body('numero_documento').notEmpty().withMessage('Número de documento requerido'),
  body('nombres').notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').notEmpty().withMessage('Apellidos requeridos'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono').notEmpty().withMessage('Teléfono requerido'),
  body('direcciones').optional().isArray(),
  body('direcciones.*.direccion').optional().notEmpty().withMessage('Dirección requerida')
];

const updateClienteValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('tipo_documento').isIn(['DNI', 'RUC', 'CE', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
  body('numero_documento').notEmpty().withMessage('Número de documento requerido'),
  body('nombres').notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').notEmpty().withMessage('Apellidos requeridos'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono').notEmpty().withMessage('Teléfono requerido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

const addDireccionValidation = [
  param('cliente_id').isInt().withMessage('ID de cliente inválido'),
  body('direccion').notEmpty().withMessage('Dirección requerida'),
  body('es_principal').optional().isBoolean()
];

const registrarCompraValidation = [
  param('cliente_id').isInt().withMessage('ID de cliente inválido'),
  body('venta_id').isInt().withMessage('ID de venta inválido'),
  body('sucursal_id').isInt().withMessage('ID de sucursal inválido'),
  body('total').isDecimal({ min: 0 }).withMessage('Total inválido'),
  body('productos').isInt({ min: 1 }).withMessage('Cantidad de productos inválida'),
  body('unidades').isInt({ min: 1 }).withMessage('Unidades inválidas')
];

const actualizarFrecuenciaValidation = [
  body('cliente_id').isInt().withMessage('ID de cliente inválido'),
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad inválida'),
  body('total').isDecimal({ min: 0 }).withMessage('Total inválido')
];

// ============ RUTAS PROTEGIDAS ============
router.use(authMiddleware);

// ============ CLIENTES ============
router.get('/clientes', getClientes);
router.get('/clientes/buscar', buscarPorDocumento);
router.get('/clientes/estadisticas', checkRole(['ADMIN', 'GERENTE']), getEstadisticas);
router.get('/clientes/frecuentes', checkRole(['ADMIN', 'GERENTE']), getClientesFrecuentes);
router.get('/clientes/:id', param('id').isInt(), validate, getClienteById);
router.post('/clientes', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), createClienteValidation, validate, createCliente);
router.put('/clientes/:id', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), updateClienteValidation, validate, updateCliente);
router.delete('/clientes/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteCliente);

// ============ DIRECCIONES ============
router.get('/clientes/:cliente_id/direcciones', param('cliente_id').isInt(), validate, getDirecciones);
router.post('/clientes/:cliente_id/direcciones', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), addDireccionValidation, validate, addDireccion);

// ============ HISTORIAL DE COMPRAS ============
router.get('/clientes/:cliente_id/historial', param('cliente_id').isInt(), validate, getHistorialCompras);
router.post('/clientes/:cliente_id/historial', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), registrarCompraValidation, validate, registrarCompra);

// ============ FRECUENCIA DE COMPRAS ============
router.post('/frecuencia', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), actualizarFrecuenciaValidation, validate, actualizarFrecuencia);
router.get('/clientes/:cliente_id/productos-frecuentes', param('cliente_id').isInt(), validate, getProductosFrecuentes);

module.exports = router;