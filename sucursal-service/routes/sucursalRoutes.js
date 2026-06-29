const express = require('express');
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  solicitarTransferencia,
  getTransferencias,
  autorizarTransferencia,
  completarTransferencia,
  cancelarTransferencia
} = require('../controllers/sucursalController');

const router = express.Router();

// Validaciones
const createSucursalValidation = [
  body('nombre').notEmpty().withMessage('Nombre requerido').isLength({ max: 100 }),
  body('codigo').notEmpty().withMessage('Código requerido').isLength({ max: 20 }),
  body('direccion').notEmpty().withMessage('Dirección requerida'),
  body('telefono').notEmpty().withMessage('Teléfono requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('horario_atencion').optional().isString(),
  body('encargado').optional().isString()
];

const updateSucursalValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('nombre').notEmpty().withMessage('Nombre requerido').isLength({ max: 100 }),
  body('codigo').notEmpty().withMessage('Código requerido').isLength({ max: 20 }),
  body('direccion').notEmpty().withMessage('Dirección requerida'),
  body('telefono').notEmpty().withMessage('Teléfono requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

const transferenciaValidation = [
  body('sucursal_origen_id').isInt().withMessage('ID de sucursal origen inválido'),
  body('sucursal_destino_id').isInt().withMessage('ID de sucursal destino inválido'),
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('lote').optional().isString(),
  body('fecha_vencimiento').optional().isDate().withMessage('Fecha de vencimiento inválida'),
  body('observaciones').optional().isString()
];

// Rutas protegidas
router.use(authMiddleware);

// Sucursales
router.get('/sucursales', getSucursales);
router.get('/sucursales/:id', param('id').isInt(), validate, getSucursalById);
router.post('/sucursales', checkRole(['ADMIN', 'GERENTE']), createSucursalValidation, validate, createSucursal);
router.put('/sucursales/:id', checkRole(['ADMIN', 'GERENTE']), updateSucursalValidation, validate, updateSucursal);
router.delete('/sucursales/:id', checkRole(['ADMIN']), param('id').isInt(), validate, deleteSucursal);

// Transferencias
router.post('/transferencias/solicitar', checkRole(['GERENTE', 'ADMIN']), transferenciaValidation, validate, solicitarTransferencia);
router.get('/transferencias', getTransferencias);
router.put('/transferencias/:id/autorizar', checkRole(['GERENTE', 'ADMIN']), param('id').isInt(), validate, autorizarTransferencia);
router.put('/transferencias/:id/completar', checkRole(['GERENTE', 'ADMIN']), param('id').isInt(), validate, completarTransferencia);
router.put('/transferencias/:id/cancelar', checkRole(['GERENTE', 'ADMIN']), param('id').isInt(), validate, cancelarTransferencia);

module.exports = router;