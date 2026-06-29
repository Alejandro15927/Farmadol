const { Reporte, Alerta } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const InventarioService = require('../services/inventarioService');
const VentasService = require('../services/ventasService');
const ClienteService = require('../services/clienteService');
const ReportGenerator = require('../utils/reportGenerator');

// ============ REPORTES ============

// Generar reporte de ventas diarias
const generarReporteVentasDiarias = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fecha, sucursal_id, formato = 'json' } = req.body;
    const usuario_id = req.user.id;

    const ventasService = new VentasService(req.headers.authorization?.split(' ')[1]);
    
    // Obtener ventas del día
    const fechaObj = fecha ? new Date(fecha) : new Date();
    const fechaStr = fechaObj.toISOString().split('T')[0];
    
    const params = {
      fecha_inicio: `${fechaStr} 00:00:00`,
      fecha_fin: `${fechaStr} 23:59:59`
    };
    if (sucursal_id) params.sucursal_id = sucursal_id;

    const result = await ventasService.getVentas(params);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay ventas para la fecha seleccionada'
      });
    }

    const ventas = result.data;

    // Generar reporte
    const reporte = await Reporte.create({
      tipo: 'ventas_diarias',
      nombre: `Reporte de Ventas Diarias - ${fechaStr}`,
      descripcion: `Ventas realizadas el día ${fechaStr}`,
      parametros: { fecha: fechaStr, sucursal_id, formato },
      formato,
      usuario_id,
      sucursal_id: sucursal_id || null,
      fecha_inicio: new Date(`${fechaStr} 00:00:00`),
      fecha_fin: new Date(`${fechaStr} 23:59:59`),
      total_registros: ventas.length,
      estado: 'generando'
    });

    // Preparar datos para el reporte
    const reportData = ventas.map(v => ({
      numero_venta: v.numero_venta,
      cliente: v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos}` : 'Cliente general',
      metodo_pago: v.metodo_pago?.nombre || 'N/A',
      total: v.total,
      productos: v.detalles?.length || 0,
      unidades: v.detalles?.reduce((sum, d) => sum + d.cantidad, 0) || 0,
      fecha_venta: new Date(v.fecha_venta).toLocaleString()
    }));

    // Generar archivo
    const reportGenerator = new ReportGenerator();
    const filename = `ventas_diarias_${fechaStr}_${Date.now()}`;
    let fileResult;

    if (formato === 'csv') {
      const headers = ['numero_venta', 'cliente', 'metodo_pago', 'total', 'productos', 'unidades', 'fecha_venta'];
      fileResult = reportGenerator.generateCSV(reportData, headers, filename);
    } else if (formato === 'json') {
      fileResult = reportGenerator.generateJSON(reportData, filename);
    } else {
      const headers = ['numero_venta', 'cliente', 'metodo_pago', 'total', 'productos', 'unidades', 'fecha_venta'];
      fileResult = reportGenerator.generateSimpleHTML(reportData, `Reporte de Ventas - ${fechaStr}`, headers);
    }

    if (fileResult.success) {
      await reporte.update({
        ruta_archivo: fileResult.filepath,
        tamanio_archivo: fileResult.size,
        estado: 'completado',
        fecha_completado: new Date()
      });
    } else {
      await reporte.update({
        estado: 'fallido',
        observaciones: fileResult.error || 'Error al generar el archivo'
      });
    }

    const reporteCompleto = await Reporte.findByPk(reporte.id);

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: reporteCompleto
    });
  } catch (error) {
    console.error('Error en generarReporteVentasDiarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar reporte de productos más vendidos
const generarReporteProductosMasVendidos = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fecha_inicio, fecha_fin, sucursal_id, limit = 20, formato = 'json' } = req.body;
    const usuario_id = req.user.id;

    const ventasService = new VentasService(req.headers.authorization?.split(' ')[1]);

    const params = {
      fecha_inicio,
      fecha_fin,
      limit,
      sucursal_id
    };

    const result = await ventasService.getProductosMasVendidos(params);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay datos de productos vendidos'
      });
    }

    const productos = result.data;

    const reporte = await Reporte.create({
      tipo: 'productos_mas_vendidos',
      nombre: `Reporte de Productos Más Vendidos`,
      descripcion: `Top ${limit} productos más vendidos del período`,
      parametros: { fecha_inicio, fecha_fin, sucursal_id, limit, formato },
      formato,
      usuario_id,
      sucursal_id: sucursal_id || null,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      total_registros: productos.length,
      estado: 'generando'
    });

    const reportData = productos.map(p => ({
      producto_id: p.producto_id,
      cantidad: p.cantidad,
      total_ventas: p.total_ventas,
      total_monto: p.total_monto
    }));

    const reportGenerator = new ReportGenerator();
    const filename = `productos_mas_vendidos_${Date.now()}`;
    let fileResult;

    if (formato === 'csv') {
      const headers = ['producto_id', 'cantidad', 'total_ventas', 'total_monto'];
      fileResult = reportGenerator.generateCSV(reportData, headers, filename);
    } else if (formato === 'json') {
      fileResult = reportGenerator.generateJSON(reportData, filename);
    } else {
      const headers = ['producto_id', 'cantidad', 'total_ventas', 'total_monto'];
      fileResult = reportGenerator.generateSimpleHTML(reportData, 'Productos Más Vendidos', headers);
    }

    if (fileResult.success) {
      await reporte.update({
        ruta_archivo: fileResult.filepath,
        tamanio_archivo: fileResult.size,
        estado: 'completado',
        fecha_completado: new Date()
      });
    } else {
      await reporte.update({
        estado: 'fallido',
        observaciones: fileResult.error || 'Error al generar el archivo'
      });
    }

    const reporteCompleto = await Reporte.findByPk(reporte.id);

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: reporteCompleto
    });
  } catch (error) {
    console.error('Error en generarReporteProductosMasVendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar reporte de stock bajo
const generarReporteStockBajo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sucursal_id, formato = 'json' } = req.body;
    const usuario_id = req.user.id;

    const inventarioService = new InventarioService(req.headers.authorization?.split(' ')[1]);

    const result = await inventarioService.getStockBajo(sucursal_id);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay productos con stock bajo'
      });
    }

    const productos = result.data;

    const reporte = await Reporte.create({
      tipo: 'stock_bajo',
      nombre: `Reporte de Productos con Stock Bajo`,
      descripcion: 'Productos que requieren reposición',
      parametros: { sucursal_id, formato },
      formato,
      usuario_id,
      sucursal_id: sucursal_id || null,
      total_registros: productos.length,
      estado: 'generando'
    });

    const reportData = productos.map(p => ({
      producto: p.producto?.nombre || 'N/A',
      codigo: p.producto?.codigo || 'N/A',
      stock_actual: p.cantidad_disponible,
      stock_minimo: p.producto?.stock_minimo || 0,
      sucursal: p.sucursal_id
    }));

    const reportGenerator = new ReportGenerator();
    const filename = `stock_bajo_${Date.now()}`;
    let fileResult;

    if (formato === 'csv') {
      const headers = ['producto', 'codigo', 'stock_actual', 'stock_minimo', 'sucursal'];
      fileResult = reportGenerator.generateCSV(reportData, headers, filename);
    } else if (formato === 'json') {
      fileResult = reportGenerator.generateJSON(reportData, filename);
    } else {
      const headers = ['producto', 'codigo', 'stock_actual', 'stock_minimo', 'sucursal'];
      fileResult = reportGenerator.generateSimpleHTML(reportData, 'Productos con Stock Bajo', headers);
    }

    if (fileResult.success) {
      await reporte.update({
        ruta_archivo: fileResult.filepath,
        tamanio_archivo: fileResult.size,
        estado: 'completado',
        fecha_completado: new Date()
      });
    } else {
      await reporte.update({
        estado: 'fallido',
        observaciones: fileResult.error || 'Error al generar el archivo'
      });
    }

    // Generar alertas si hay productos críticos
    for (const item of productos) {
      if (item.cantidad_disponible <= (item.producto?.stock_minimo || 10) / 2) {
        await Alerta.create({
          tipo: 'stock_bajo',
          nivel: 'critical',
          titulo: `Stock crítico: ${item.producto?.nombre || 'Producto'}`,
          mensaje: `El producto ${item.producto?.nombre || 'N/A'} tiene solo ${item.cantidad_disponible} unidades disponibles en la sucursal ${item.sucursal_id}`,
          datos: item,
          sucursal_id: item.sucursal_id,
          estado: 'activa'
        });
      }
    }

    const reporteCompleto = await Reporte.findByPk(reporte.id);

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: reporteCompleto
    });
  } catch (error) {
    console.error('Error en generarReporteStockBajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar reporte de productos próximos a vencer
const generarReporteProximosVencer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { dias = 30, sucursal_id, formato = 'json' } = req.body;
    const usuario_id = req.user.id;

    const inventarioService = new InventarioService(req.headers.authorization?.split(' ')[1]);

    const result = await inventarioService.getProximosVencer(dias, sucursal_id);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay productos próximos a vencer'
      });
    }

    const productos = result.data;

    const reporte = await Reporte.create({
      tipo: 'productos_vencer',
      nombre: `Reporte de Productos Próximos a Vencer (${dias} días)`,
      descripcion: `Productos que vencen en los próximos ${dias} días`,
      parametros: { dias, sucursal_id, formato },
      formato,
      usuario_id,
      sucursal_id: sucursal_id || null,
      total_registros: productos.length,
      estado: 'generando'
    });

    const reportData = productos.map(p => ({
      producto: p.producto?.nombre || 'N/A',
      codigo: p.producto?.codigo || 'N/A',
      lote: p.lote,
      cantidad: p.cantidad,
      fecha_vencimiento: new Date(p.fecha_vencimiento).toLocaleDateString(),
      dias_restantes: Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)),
      sucursal: p.sucursal_id
    }));

    const reportGenerator = new ReportGenerator();
    const filename = `proximos_vencer_${Date.now()}`;
    let fileResult;

    if (formato === 'csv') {
      const headers = ['producto', 'codigo', 'lote', 'cantidad', 'fecha_vencimiento', 'dias_restantes', 'sucursal'];
      fileResult = reportGenerator.generateCSV(reportData, headers, filename);
    } else if (formato === 'json') {
      fileResult = reportGenerator.generateJSON(reportData, filename);
    } else {
      const headers = ['producto', 'codigo', 'lote', 'cantidad', 'fecha_vencimiento', 'dias_restantes', 'sucursal'];
      fileResult = reportGenerator.generateSimpleHTML(reportData, `Productos Próximos a Vencer (${dias} días)`, headers);
    }

    if (fileResult.success) {
      await reporte.update({
        ruta_archivo: fileResult.filepath,
        tamanio_archivo: fileResult.size,
        estado: 'completado',
        fecha_completado: new Date()
      });
    } else {
      await reporte.update({
        estado: 'fallido',
        observaciones: fileResult.error || 'Error al generar el archivo'
      });
    }

    // Generar alertas para productos críticos (menos de 15 días)
    for (const item of productos) {
      const diasRestantes = Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
      if (diasRestantes <= 15) {
        await Alerta.create({
          tipo: 'producto_vencer',
          nivel: diasRestantes <= 7 ? 'critical' : 'warning',
          titulo: `Producto próximo a vencer: ${item.producto?.nombre || 'Producto'}`,
          mensaje: `El producto ${item.producto?.nombre || 'N/A'} (Lote: ${item.lote}) vence en ${diasRestantes} días`,
          datos: item,
          sucursal_id: item.sucursal_id,
          estado: 'activa'
        });
      }
    }

    const reporteCompleto = await Reporte.findByPk(reporte.id);

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: reporteCompleto
    });
  } catch (error) {
    console.error('Error en generarReporteProximosVencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar reporte de clientes frecuentes
const generarReporteClientesFrecuentes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { limit = 20, min_compras = 3, formato = 'json' } = req.body;
    const usuario_id = req.user.id;

    const clienteService = new ClienteService(req.headers.authorization?.split(' ')[1]);

    const result = await clienteService.getClientesFrecuentes({ limit, min_compras });
    
    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay clientes frecuentes'
      });
    }

    const clientes = result.data;

    const reporte = await Reporte.create({
      tipo: 'clientes_frecuentes',
      nombre: `Reporte de Clientes Frecuentes`,
      descripcion: `Top ${limit} clientes con más compras`,
      parametros: { limit, min_compras, formato },
      formato,
      usuario_id,
      total_registros: clientes.length,
      estado: 'generando'
    });

    const reportData = clientes.map(c => ({
      cliente: `${c.nombres} ${c.apellidos}`,
      documento: c.numero_documento,
      email: c.email,
      telefono: c.telefono,
      total_compras: c.total_compras,
      total_gastado: c.total_gastado,
      promedio_gasto: c.promedio_gasto,
      nivel: c.nivel,
      ultima_compra: c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString() : 'N/A'
    }));

    const reportGenerator = new ReportGenerator();
    const filename = `clientes_frecuentes_${Date.now()}`;
    let fileResult;

    if (formato === 'csv') {
      const headers = ['cliente', 'documento', 'email', 'telefono', 'total_compras', 'total_gastado', 'promedio_gasto', 'nivel', 'ultima_compra'];
      fileResult = reportGenerator.generateCSV(reportData, headers, filename);
    } else if (formato === 'json') {
      fileResult = reportGenerator.generateJSON(reportData, filename);
    } else {
      const headers = ['cliente', 'documento', 'email', 'telefono', 'total_compras', 'total_gastado', 'promedio_gasto', 'nivel', 'ultima_compra'];
      fileResult = reportGenerator.generateSimpleHTML(reportData, 'Clientes Frecuentes', headers);
    }

    if (fileResult.success) {
      await reporte.update({
        ruta_archivo: fileResult.filepath,
        tamanio_archivo: fileResult.size,
        estado: 'completado',
        fecha_completado: new Date()
      });
    } else {
      await reporte.update({
        estado: 'fallido',
        observaciones: fileResult.error || 'Error al generar el archivo'
      });
    }

    const reporteCompleto = await Reporte.findByPk(reporte.id);

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: reporteCompleto
    });
  } catch (error) {
    console.error('Error en generarReporteClientesFrecuentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ OBTENER REPORTES ============

// Obtener todos los reportes
const getReportes = async (req, res) => {
  try {
    const { tipo, estado, usuario_id, fecha_inicio, fecha_fin, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (usuario_id) where.usuario_id = usuario_id;
    
    if (fecha_inicio && fecha_fin) {
      where.fecha_generacion = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const { count, rows } = await Reporte.findAndCountAll({
      where,
      order: [['fecha_generacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error en getReportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener reporte por ID
const getReporteById = async (req, res) => {
  try {
    const { id } = req.params;

    const reporte = await Reporte.findByPk(id);
    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('Error en getReporteById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Descargar reporte
const descargarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const fs = require('fs');

    const reporte = await Reporte.findByPk(id);
    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    if (!reporte.ruta_archivo || !fs.existsSync(reporte.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de reporte no encontrado'
      });
    }

    const filename = path.basename(reporte.ruta_archivo);
    res.download(reporte.ruta_archivo, filename);
  } catch (error) {
    console.error('Error en descargarReporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ ALERTAS ============

// Obtener alertas
const getAlertas = async (req, res) => {
  try {
    const { estado, tipo, nivel, leida, sucursal_id, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (nivel) where.nivel = nivel;
    if (leida !== undefined) where.leida = leida === 'true';
    if (sucursal_id) where.sucursal_id = sucursal_id;

    const { count, rows } = await Alerta.findAndCountAll({
      where,
      order: [['fecha_creacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error en getAlertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Marcar alerta como leída
const marcarAlertaLeida = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await Alerta.findByPk(id);
    if (!alerta) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    await alerta.update({
      leida: true,
      fecha_lectura: new Date()
    });

    res.json({
      success: true,
      message: 'Alerta marcada como leída',
      data: alerta
    });
  } catch (error) {
    console.error('Error en marcarAlertaLeida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Resolver alerta
const resolverAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const alerta = await Alerta.findByPk(id);
    if (!alerta) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    await alerta.update({
      estado: 'resuelta',
      fecha_resolucion: new Date(),
      mensaje: alerta.mensaje + `\nResuelta: ${observaciones || 'Sin observaciones'}`
    });

    res.json({
      success: true,
      message: 'Alerta resuelta',
      data: alerta
    });
  } catch (error) {
    console.error('Error en resolverAlerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear alerta manual
const crearAlerta = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { tipo, nivel, titulo, mensaje, datos, sucursal_id } = req.body;
    const usuario_id = req.user.id;

    const alerta = await Alerta.create({
      tipo,
      nivel: nivel || 'info',
      titulo,
      mensaje,
      datos: datos || {},
      sucursal_id: sucursal_id || null,
      usuario_id,
      leida: false,
      estado: 'activa'
    });

    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: alerta
    });
  } catch (error) {
    console.error('Error en crearAlerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
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
};