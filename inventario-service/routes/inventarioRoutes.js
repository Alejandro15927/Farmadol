const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  // Categorías
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  // Productos
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  enableProducto,
  // Inventario
  getStock,
  getStockGlobal,
  entradaInventario,
  salidaInventario,
  transferenciaInventario,
  // Movimientos
  getMovimientos,
  // Alertas
  getStockBajo,
  getProductosPorVencer,
  // Estadísticas
  getEstadisticas
} = require('../controllers/inventarioController');

const router = express.Router();

// ============ VALIDACIONES ============

const createCategoriaValidation = [
  body('nombre').notEmpty().withMessage('Nombre de categoría requerido')
];

const updateCategoriaValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('nombre').optional().notEmpty().withMessage('Nombre de categoría requerido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

const createProductoValidation = [
  body('sku').notEmpty().withMessage('SKU requerido'),
  body('codigo').notEmpty().withMessage('Código requerido'),
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('categoria_id').isInt().withMessage('ID de categoría inválido'),
  body('precio_compra').optional().isDecimal({ min: 0 }).withMessage('Precio de compra inválido'),
  body('precio_venta').optional().isDecimal({ min: 0 }).withMessage('Precio de venta inválido')
];

const updateProductoValidation = [
  param('id').isInt().withMessage('ID inválido'),
  body('estado').optional().isBoolean().withMessage('Estado debe ser booleano')
];

const entradaInventarioValidation = [
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('sucursal_id').isInt().withMessage('ID de sucursal inválido'),
  body('lote').notEmpty().withMessage('Lote requerido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('fecha_vencimiento').isDate().withMessage('Fecha de vencimiento inválida')
];

const salidaInventarioValidation = [
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('sucursal_id').isInt().withMessage('ID de sucursal inválido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0')
];

const transferenciaInventarioValidation = [
  body('producto_id').isInt().withMessage('ID de producto inválido'),
  body('sucursal_origen_id').isInt().withMessage('ID de sucursal origen inválido'),
  body('sucursal_destino_id').isInt().withMessage('ID de sucursal destino inválido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('lote').notEmpty().withMessage('Lote requerido')
];

// ============ RUTAS ============

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============ CATEGORÍAS ============
router.get('/categorias', getCategorias);
router.get('/categorias/:id', param('id').isInt(), validate, getCategoriaById);
router.post('/categorias', checkRole(['ADMIN', 'GERENTE']), createCategoriaValidation, validate, createCategoria);
router.put('/categorias/:id', checkRole(['ADMIN', 'GERENTE']), updateCategoriaValidation, validate, updateCategoria);
router.delete('/categorias/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteCategoria);

// ============ PRODUCTOS ============
router.get('/productos', getProductos);
router.get('/productos/:id', param('id').isInt(), validate, getProductoById);
router.post('/productos', checkRole(['ADMIN', 'GERENTE']), createProductoValidation, validate, createProducto);
router.put('/productos/:id', checkRole(['ADMIN', 'GERENTE']), updateProductoValidation, validate, updateProducto);
router.delete('/productos/:id', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, deleteProducto);
router.put('/productos/:id/enable', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, enableProducto);

// ============ INVENTARIO ============
router.get('/stock', getStock);
router.get('/stock/global', getStockGlobal);
router.post('/entrada', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), entradaInventarioValidation, validate, entradaInventario);
router.post('/salida', checkRole(['ADMIN', 'GERENTE', 'CAJERO']), salidaInventarioValidation, validate, salidaInventario);
router.post('/transferencia', checkRole(['ADMIN', 'GERENTE', 'ALMACENERO']), transferenciaInventarioValidation, validate, transferenciaInventario);

// ============ MOVIMIENTOS ============
router.get('/movimientos', getMovimientos);

// ============ ALERTAS ============
router.get('/alertas/stock-bajo', getStockBajo);
router.get('/alertas/por-vencer', getProductosPorVencer);

// ============ ESTADÍSTICAS ============
router.get('/estadisticas', checkRole(['ADMIN', 'GERENTE']), getEstadisticas);

module.exports = router;