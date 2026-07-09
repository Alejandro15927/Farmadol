const express = require('express');
const { body, param, query } = require('express-validator');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  // Reportes
  generarReporteVentas,
  generarReporteInventario,
  generarReporteClientes,
  generarReporteCompras,
  generarResumenGeneral,
  getReportes,
  getReporteById,
  deleteReporte,
  descargarReporte,
  // Alertas
  getAlertas,
  getAlertaById,
  createAlerta,
  marcarAlertaLeida,
  resolverAlerta,
  ignorarAlerta,
  getAlertasNoLeidas,
  // Estadísticas
  getEstadisticas
} = require('../controllers/reporteController');

const router = express.Router();

// ============ VALIDACIONES ============

const generarReporteVentasValidation = [
  body('tipo').isIn(['ventas_diarias', 'ventas_mensuales', 'productos_mas_vendidos', 'ventas_sucursal', 'ventas_vendedor']).withMessage('Tipo de reporte inválido'),
  body('fecha_inicio').optional().isDate().withMessage('Fecha de inicio inválida'),
  body('fecha_fin').optional().isDate().withMessage('Fecha de fin inválida'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const generarReporteInventarioValidation = [
  body('tipo').isIn(['stock_bajo', 'productos_vencer', 'rotacion_inventario']).withMessage('Tipo de reporte inválido'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const generarReporteClientesValidation = [
  body('tipo').isIn(['clientes_frecuentes', 'resumen_general']).withMessage('Tipo de reporte inválido'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const generarReporteComprasValidation = [
  body('tipo').isIn(['compras_proveedores', 'resumen_general']).withMessage('Tipo de reporte inválido'),
  body('fecha_inicio').optional().isDate().withMessage('Fecha de inicio inválida'),
  body('fecha_fin').optional().isDate().withMessage('Fecha de fin inválida'),
  body('formato').optional().isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Formato inválido')
];

const createAlertaValidation = [
  body('tipo').isIn(['stock_bajo', 'producto_vencer', 'producto_vencido', 'venta_alta', 'venta_baja', 'cliente_frecuente', 'problema_inventario', 'sistema']).withMessage('Tipo de alerta inválido'),
  body('titulo').notEmpty().withMessage('Título requerido'),
  body('mensaje').notEmpty().withMessage('Mensaje requerido'),
  body('nivel').optional().isIn(['info', 'warning', 'error', 'critical']).withMessage('Nivel inválido')
];

// ============ RUTAS ============

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============ REPORTES ============
router.post('/generar/ventas', checkRole(['ADMIN', 'GERENTE']), generarReporteVentasValidation, validate, generarReporteVentas);
router.post('/generar/inventario', checkRole(['ADMIN', 'GERENTE']), generarReporteInventarioValidation, validate, generarReporteInventario);
router.post('/generar/clientes', checkRole(['ADMIN', 'GERENTE']), generarReporteClientesValidation, validate, generarReporteClientes);
router.post('/generar/compras', checkRole(['ADMIN', 'GERENTE']), generarReporteComprasValidation, validate, generarReporteCompras);
router.post('/generar/resumen', checkRole(['ADMIN', 'GERENTE']), generarResumenGeneral);

router.get('/', getReportes);
router.get('/estadisticas', checkRole(['ADMIN', 'GERENTE']), getEstadisticas);
router.get('/descargar/:id', param('id').isInt(), validate, descargarReporte);  // Nueva ruta de descarga
router.get('/:id', param('id').isInt(), validate, getReporteById);
router.delete('/:id', checkRole(['ADMIN']), param('id').isInt(), validate, deleteReporte);

// ============ ALERTAS ============
router.get('/alertas', getAlertas);
router.get('/alertas/no-leidas', getAlertasNoLeidas);
router.get('/alertas/:id', param('id').isInt(), validate, getAlertaById);
router.post('/alertas', checkRole(['ADMIN', 'GERENTE']), createAlertaValidation, validate, createAlerta);
router.put('/alertas/:id/leer', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, marcarAlertaLeida);
router.put('/alertas/:id/resolver', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, resolverAlerta);
router.put('/alertas/:id/ignorar', checkRole(['ADMIN', 'GERENTE']), param('id').isInt(), validate, ignorarAlerta);

module.exports = router;