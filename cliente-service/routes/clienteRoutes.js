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
  enableCliente,
  getClienteByDocumento,
  getClientesFrecuentes,
  addDireccion,
  updateDireccion,
  deleteDireccion,
  registrarHistorialCompra,
  getHistorialCompras,
  getEstadisticas
} = require('../controllers/clienteController');

const router = express.Router();

// ============ VALIDACIONES ============

const createClienteValidation = [
  body('tipo_documento').optional().isIn(['DNI', 'RUC', 'CE', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
  body('numero_documento').notEmpty().withMessage('Número de documento requerido'),
  body('nombres').notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').notEmpty().withMessage('Apellidos requeridos'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono').notEmpty().withMessage('Teléfono requerido'),
  body('direcciones').optional().isArray().withMessage('Direcciones debe ser un array')
];

const updateClienteValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('numero_documento').optional().notEmpty().withMessage('Número de documento requerido'),
  body('nombres').optional().notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').optional().notEmpty().withMessage('Apellidos requeridos'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano'),
  body('nivel').optional().isIn(['bronce', 'plata', 'oro', 'platino', 'diamante']).withMessage('Nivel inválido')
];

const addDireccionValidation = [
  param('cliente_id').isInt().withMessage('ID de cliente inválido'),
  body('direccion').notEmpty().withMessage('Dirección requerida'),
  body('es_principal').optional().isBoolean().withMessage('es_principal debe ser booleano')
];

const updateDireccionValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('direccion').optional().notEmpty().withMessage('Dirección requerida'),
  body('es_principal').optional().isBoolean().withMessage('es_principal debe ser booleano')
];

const registrarHistorialValidation = [
  param('cliente_id').isInt().withMessage('ID de cliente inválido'),
  body('venta_id').isInt().withMessage('ID de venta inválido'),
  body('sucursal_id').isInt().withMessage('ID de sucursal inválido'),
  body('total').isDecimal({ min: 0 }).withMessage('Total inválido'),
  body('productos').isInt({ min: 0 }).withMessage('Cantidad de productos inválida'),
  body('unidades').isInt({ min: 0 }).withMessage('Cantidad de unidades inválida')
];

// ============ RUTAS ============

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============ CLIENTES ============
router.get('/', getClientes);
router.get('/frecuentes', getClientesFrecuentes);
router.get('/estadisticas', checkRole(['ADMIN', 'GERENTE']), getEstadisticas);
router.get('/documento/:documento', getClienteByDocumento);
router.get('/:id', param('id').isInt(), validate, getClienteById);

router.post('/', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), createClienteValidation, validate, createCliente);

router.put('/:id', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), updateClienteValidation, validate, updateCliente);

router.delete('/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteCliente);

router.put('/:id/enable', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, enableCliente);

// ============ DIRECCIONES ============
router.post('/:cliente_id/direcciones', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), addDireccionValidation, validate, addDireccion);

router.put('/direcciones/:id', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), updateDireccionValidation, validate, updateDireccion);

router.delete('/direcciones/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteDireccion);

// ============ HISTORIAL DE COMPRAS ============
router.post('/:cliente_id/historial', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), registrarHistorialValidation, validate, registrarHistorialCompra);

router.get('/:cliente_id/historial', param('cliente_id').isInt(), validate, getHistorialCompras);

module.exports = router;