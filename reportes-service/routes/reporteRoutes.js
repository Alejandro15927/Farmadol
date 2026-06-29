const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  generarReporteVentasDiarias,
  generarReporteProductosMasVendidos,
  generarReporteStockBajo,
  generarReporteProximosVencer,
  generarReporteClientesFrecuentes,
  getReportes,
  getReporteById,
  descargarReporte,
  getAlertas,
  marcarAlertaLeida,
  resolverAlerta,
  crearAlerta
} = require('../controllers/reporteController');

const router = express.Router();

// Validaciones
const reporteVentasDiariasValidation = [
  body('fecha').optional().isDate().withMessage('Fecha inválida'),
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const reporteProductosValidation = [
  body('fecha_inicio').optional().isDate().withMessage('Fecha inicio inválida'),
  body('fecha_fin').optional().isDate().withMessage('Fecha fin inválida'),
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const reporteStockValidation = [
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const reporteVencerValidation = [
  body('dias').optional().isInt({ min: 1, max: 365 }).withMessage('Días debe ser entre 1 y 365'),
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const reporteClientesValidation = [
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),
  body('min_compras').optional().isInt({ min: 1 }).withMessage('Mínimo de compras inválido'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const alertaValidation = [
  body('tipo').isIn(['stock_bajo', 'producto_vencer', 'producto_vencido', 'venta_alta', 'venta_baja', 'cliente_frecuente', 'problema_inventario', 'sistema']).withMessage('Tipo inválido'),
  body('nivel').optional().isIn(['info', 'warning', 'error', 'critical']).withMessage('Nivel inválido'),
  body('titulo').notEmpty().withMessage('Título requerido'),
  body('mensaje').notEmpty().withMessage('Mensaje requerido'),
  body('sucursal_id').optional().isInt().withMessage('ID de sucursal inválido')
];

// ============ RUTAS PROTEGIDAS ============
router.use(authMiddleware);

// ============ REPORTES ============
// Generar reportes (solo ADMIN y GERENTE)
router.post('/reportes/ventas-diarias', checkRole(['ADMIN', 'GERENTE']), reporteVentasDiariasValidation, validate, generarReporteVentasDiarias);
router.post('/reportes/productos-mas-vendidos', checkRole(['ADMIN', 'GERENTE']), reporteProductosValidation, validate, generarReporteProductosMasVendidos);
router.post('/reportes/stock-bajo', checkRole(['ADMIN', 'GERENTE']), reporteStockValidation, validate, generarReporteStockBajo);
router.post('/reportes/proximos-vencer', checkRole(['ADMIN', 'GERENTE']), reporteVencerValidation, validate, generarReporteProximosVencer);
router.post('/reportes/clientes-frecuentes', checkRole(['ADMIN', 'GERENTE']), reporteClientesValidation, validate, generarReporteClientesFrecuentes);

// Obtener reportes
router.get('/reportes', getReportes);
router.get('/reportes/:id', param('id').isInt(), validate, getReporteById);
router.get('/reportes/:id/descargar', param('id').isInt(), validate, descargarReporte);

// ============ ALERTAS ============
router.get('/alertas', getAlertas);
router.put('/alertas/:id/leida', param('id').isInt(), validate, marcarAlertaLeida);
router.put('/alertas/:id/resolver', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, resolverAlerta);
router.post('/alertas', checkRole(['ADMIN', 'GERENTE']), alertaValidation, validate, crearAlerta);

module.exports = router;