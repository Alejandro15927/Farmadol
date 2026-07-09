const { Cliente, MetodoPago, Venta, VentaDetalle } = require('../models');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');

const INVENTARIO_SERVICE_URL = process.env.INVENTARIO_SERVICE_URL || 'http://localhost:3004';
const CLIENTE_SERVICE_URL = process.env.CLIENTE_SERVICE_URL || 'http://localhost:3003';
const TASA_IGV = 0.18;

// ============ FUNCIONES AUXILIARES ============

async function validarStockDisponible(authHeader, sucursalId, detalles) {
  for (const detalle of detalles) {
    const response = await fetch(
      `${INVENTARIO_SERVICE_URL}/api/inventario/stock?producto_id=${detalle.producto_id}&sucursal_id=${sucursalId}`,
      { headers: { Authorization: authHeader } }
    );
    const data = await response.json().catch(() => ({}));
    const stockDisponible = data.data?.total_stock ?? 0;
    if (!response.ok || !data.success || stockDisponible < detalle.cantidad) {
      throw new Error(
        `Stock insuficiente para producto ID ${detalle.producto_id}. Disponible: ${stockDisponible}`
      );
    }
  }
}

async function descontarStockInventario(authHeader, sucursalId, detalles, ventaId, numeroVenta) {
  const resultados = [];
  for (const detalle of detalles) {
    const response = await fetch(`${INVENTARIO_SERVICE_URL}/api/inventario/salida`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({
        producto_id: detalle.producto_id,
        sucursal_id: sucursalId,
        cantidad: detalle.cantidad,
        referencia_id: ventaId,
        lote_especifico: detalle.lote || null,
        observaciones: `Salida por venta ${numeroVenta}`
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Error al descontar stock del producto ${detalle.producto_id}`);
    }
    resultados.push(data.data);
  }
  return resultados;
}

async function registrarHistorialCliente(authHeader, clienteId, ventaId, sucursalId, total, productos, unidades, metodoPago) {
  if (!clienteId) return null;
  
  const response = await fetch(`${CLIENTE_SERVICE_URL}/api/clientes/${clienteId}/historial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify({
      venta_id: ventaId,
      sucursal_id: sucursalId,
      fecha_compra: new Date(),
      total,
      productos,
      unidades,
      metodo_pago: metodoPago
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Error al registrar historial:', data);
  }
  return data;
}

// ============ CLIENTES ============

// Obtener todos los clientes (desde cliente-service)
const getClientes = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { search } = req.query;

    let url = `${CLIENTE_SERVICE_URL}/api/clientes`;
    if (search) url += `?search=${search}`;

    const response = await fetch(url, {
      headers: { Authorization: authHeader }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Error al obtener clientes'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getClientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener cliente por ID (desde cliente-service)
const getClienteById = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { id } = req.params;

    const response = await fetch(`${CLIENTE_SERVICE_URL}/api/clientes/${id}`, {
      headers: { Authorization: authHeader }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Error al obtener cliente'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getClienteById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar cliente por documento (desde cliente-service)
const getClienteByDocumento = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { documento } = req.params;

    const response = await fetch(`${CLIENTE_SERVICE_URL}/api/clientes/documento/${documento}`, {
      headers: { Authorization: authHeader }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Error al buscar cliente'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error en getClienteByDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear cliente (desde cliente-service)
const createCliente = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    const response = await fetch(`${CLIENTE_SERVICE_URL}/api/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Error al crear cliente'
      });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error en createCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ MÉTODOS DE PAGO ============

// Obtener métodos de pago
const getMetodosPago = async (req, res) => {
  try {
    const metodos = await MetodoPago.findAll({
      where: { estado: true },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: metodos
    });
  } catch (error) {
    console.error('Error en getMetodosPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear método de pago
const createMetodoPago = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nombre, descripcion } = req.body;

    const existing = await MetodoPago.findOne({ where: { nombre } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un método de pago con ese nombre'
      });
    }

    const metodo = await MetodoPago.create({
      nombre,
      descripcion,
      estado: true
    });

    res.status(201).json({
      success: true,
      message: 'Método de pago creado exitosamente',
      data: metodo
    });
  } catch (error) {
    console.error('Error en createMetodoPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar método de pago
const updateMetodoPago = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;

    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    if (nombre && nombre !== metodo.nombre) {
      const existing = await MetodoPago.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro método de pago con ese nombre'
        });
      }
    }

    await metodo.update({
      nombre: nombre || metodo.nombre,
      descripcion: descripcion !== undefined ? descripcion : metodo.descripcion,
      estado: estado !== undefined ? estado : metodo.estado
    });

    res.json({
      success: true,
      message: 'Método de pago actualizado exitosamente',
      data: metodo
    });
  } catch (error) {
    console.error('Error en updateMetodoPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar método de pago
const deleteMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;

    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    // Verificar si tiene ventas asociadas
    const ventas = await Venta.count({ where: { metodo_pago_id: id } });
    if (ventas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el método de pago porque tiene ventas asociadas'
      });
    }

    await metodo.update({ estado: false });

    res.json({
      success: true,
      message: 'Método de pago deshabilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteMetodoPago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ VENTAS ============

// Registrar una venta
const registrarVenta = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      sucursal_id,
      cliente_id,
      metodo_pago_id,
      descuento,
      monto_recibido,
      observaciones,
      detalles
    } = req.body;

    const usuario_id = req.user.id;
    const authHeader = req.headers.authorization;

    // Validar método de pago
    const metodoPago = await MetodoPago.findByPk(metodo_pago_id);
    if (!metodoPago) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    // Verificar cliente (si se proporciona)
    if (cliente_id) {
      try {
        const response = await fetch(`${CLIENTE_SERVICE_URL}/api/clientes/${cliente_id}`, {
          headers: { Authorization: authHeader }
        });
        if (!response.ok) {
          return res.status(404).json({
            success: false,
            message: 'Cliente no encontrado'
          });
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error al verificar cliente'
        });
      }
    }

    // Calcular totales
    let totalBruto = 0;
    const detallesVenta = [];
    let totalProductos = 0;
    let totalUnidades = 0;

    for (const detalle of detalles) {
      const totalItem = detalle.cantidad * detalle.precio_unitario - (detalle.descuento || 0);
      const subtotalItem = parseFloat((totalItem / (1 + TASA_IGV)).toFixed(2));

      totalBruto += totalItem;
      totalProductos++;
      totalUnidades += detalle.cantidad;

      detallesVenta.push({
        producto_id: detalle.producto_id,
        inventario_id: detalle.inventario_id || null,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento || 0,
        subtotal: subtotalItem,
        total: totalItem,
        lote: detalle.lote || null,
        fecha_vencimiento: detalle.fecha_vencimiento || null
      });
    }

    // Validar stock
    try {
      await validarStockDisponible(authHeader, sucursal_id, detalles);
    } catch (stockError) {
      return res.status(400).json({
        success: false,
        message: stockError.message
      });
    }

    const subtotal = parseFloat((totalBruto / (1 + TASA_IGV)).toFixed(2));
    const igv = parseFloat((totalBruto - subtotal).toFixed(2));
    const descuentoAplicado = descuento || 0;
    const totalFinal = totalBruto - descuentoAplicado;

    // Generar número de venta
    const fecha = new Date();
    const fechaStr = fecha.getFullYear().toString() +
      String(fecha.getMonth() + 1).padStart(2, '0') +
      String(fecha.getDate()).padStart(2, '0');

    const lastVenta = await Venta.findOne({
      order: [['id', 'DESC']]
    });
    const correlativo = lastVenta ? parseInt(lastVenta.numero_venta.split('-')[2]) + 1 : 1;
    const numero_venta = `VEN-${fechaStr}-${String(correlativo).padStart(6, '0')}`;

    // Crear la venta
    const venta = await Venta.create({
      numero_venta,
      sucursal_id,
      usuario_id,
      cliente_id: cliente_id || null,
      metodo_pago_id,
      fecha_venta: new Date(),
      subtotal,
      igv,
      total: totalFinal,
      descuento: descuentoAplicado,
      monto_recibido,
      monto_cambio: monto_recibido ? monto_recibido - totalFinal : null,
      estado: 'completada',
      observaciones
    });

    // Crear los detalles
    for (const detalle of detallesVenta) {
      await VentaDetalle.create({
        venta_id: venta.id,
        ...detalle
      });
    }

    // Descontar stock en inventario
    try {
      await descontarStockInventario(authHeader, sucursal_id, detalles, venta.id, numero_venta);
    } catch (stockError) {
      await VentaDetalle.destroy({ where: { venta_id: venta.id } });
      await venta.destroy();
      return res.status(400).json({
        success: false,
        message: stockError.message
      });
    }

    // Registrar historial en cliente-service
    if (cliente_id) {
      try {
        await registrarHistorialCliente(
          authHeader,
          cliente_id,
          venta.id,
          sucursal_id,
          totalFinal,
          totalProductos,
          totalUnidades,
          metodoPago.nombre
        );
      } catch (error) {
        console.error('Error al registrar historial:', error);
        // No interrumpimos el flujo
      }
    }

    // Obtener la venta completa con detalles
    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [
        {
          model: MetodoPago,
          as: 'metodo_pago'
        },
        {
          model: VentaDetalle,
          as: 'detalles'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: ventaCompleta
    });
  } catch (error) {
    console.error('Error en registrarVenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todas las ventas
const getVentas = async (req, res) => {
  try {
    const {
      estado,
      sucursal_id,
      cliente_id,
      usuario_id,
      metodo_pago_id,
      fecha_inicio,
      fecha_fin
    } = req.query;

    const where = {};

    if (estado) where.estado = estado;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (cliente_id) where.cliente_id = cliente_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (metodo_pago_id) where.metodo_pago_id = metodo_pago_id;

    if (fecha_inicio && fecha_fin) {
      where.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const ventas = await Venta.findAll({
      where,
      include: [
        {
          model: MetodoPago,
          as: 'metodo_pago'
        },
        {
          model: VentaDetalle,
          as: 'detalles'
        }
      ],
      order: [['fecha_venta', 'DESC']]
    });

    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error en getVentas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener venta por ID
const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id, {
      include: [
        {
          model: MetodoPago,
          as: 'metodo_pago'
        },
        {
          model: VentaDetalle,
          as: 'detalles'
        }
      ]
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: venta
    });
  } catch (error) {
    console.error('Error en getVentaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Anular venta
const anularVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const venta = await Venta.findByPk(id);
    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    if (venta.estado === 'anulada') {
      return res.status(400).json({
        success: false,
        message: 'La venta ya está anulada'
      });
    }

    await venta.update({
      estado: 'anulada',
      observaciones: `ANULADA: ${observaciones || 'Sin motivo especificado'}`,
      fecha_actualizacion: new Date()
    });

    // Aquí se debería revertir el stock en Inventario Service

    res.json({
      success: true,
      message: 'Venta anulada exitosamente',
      data: venta
    });
  } catch (error) {
    console.error('Error en anularVenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ventas por cliente
const getVentasByCliente = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const ventas = await Venta.findAll({
      where: { cliente_id },
      include: [
        {
          model: MetodoPago,
          as: 'metodo_pago'
        },
        {
          model: VentaDetalle,
          as: 'detalles'
        }
      ],
      order: [['fecha_venta', 'DESC']]
    });

    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    console.error('Error en getVentasByCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ventas del día
const getVentasDelDia = async (req, res) => {
  try {
    const { sucursal_id } = req.query;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const where = {
      fecha_venta: {
        [Op.between]: [hoy, manana]
      },
      estado: 'completada'
    };

    if (sucursal_id) where.sucursal_id = sucursal_id;

    const ventas = await Venta.findAll({
      where,
      include: [
        {
          model: MetodoPago,
          as: 'metodo_pago'
        },
        {
          model: VentaDetalle,
          as: 'detalles'
        }
      ],
      order: [['fecha_venta', 'DESC']]
    });

    // Calcular resumen del día
    const totalVentas = ventas.length;
    const totalMonto = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalProductos = ventas.reduce((sum, v) => {
      return sum + v.detalles.reduce((s, d) => s + d.cantidad, 0);
    }, 0);

    res.json({
      success: true,
      data: {
        resumen: {
          total_ventas: totalVentas,
          total_monto: totalMonto,
          total_productos: totalProductos,
          promedio_venta: totalVentas > 0 ? totalMonto / totalVentas : 0
        },
        ventas
      }
    });
  } catch (error) {
    console.error('Error en getVentasDelDia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos más vendidos
const getProductosMasVendidos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, sucursal_id, limit = 10 } = req.query;

    const whereVenta = {
      estado: 'completada'
    };

    if (fecha_inicio && fecha_fin) {
      whereVenta.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    if (sucursal_id) whereVenta.sucursal_id = sucursal_id;

    const ventas = await Venta.findAll({
      where: whereVenta,
      include: [
        { model: VentaDetalle, as: 'detalles' }
      ]
    });

    // Agrupar por producto
    const productos = {};
    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        if (!productos[detalle.producto_id]) {
          productos[detalle.producto_id] = {
            producto_id: detalle.producto_id,
            cantidad: 0,
            total_ventas: 0,
            total_monto: 0
          };
        }
        productos[detalle.producto_id].cantidad += detalle.cantidad;
        productos[detalle.producto_id].total_ventas += 1;
        productos[detalle.producto_id].total_monto += parseFloat(detalle.total);
      });
    });

    // Ordenar y limitar
    const topProductos = Object.values(productos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: topProductos
    });
  } catch (error) {
    console.error('Error en getProductosMasVendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ ESTADÍSTICAS ============

// Obtener estadísticas de ventas
const getEstadisticas = async (req, res) => {
  try {
    const totalVentas = await Venta.count();
    const ventasCompletadas = await Venta.count({ where: { estado: 'completada' } });
    const ventasAnuladas = await Venta.count({ where: { estado: 'anulada' } });
    
    const totalIngresos = await Venta.sum('total', { where: { estado: 'completada' } });
    const totalIngresosHoy = await Venta.sum('total', {
      where: {
        estado: 'completada',
        fecha_venta: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Métodos de pago más usados
    const metodosPago = await Venta.findAll({
      attributes: [
        'metodo_pago_id',
        [Sequelize.fn('COUNT', Sequelize.col('Venta.id')), 'total_ventas'],  // ✅ Calificar columna
        [Sequelize.fn('SUM', Sequelize.col('Venta.total')), 'total_monto']   // ✅ Calificar columna
      ],
      where: { estado: 'completada' },
      group: ['metodo_pago_id'],
      include: [
        {
          model: MetodoPago,
          as: 'metodo_pago',
          attributes: ['id', 'nombre']
        }
      ],
      order: [[Sequelize.fn('SUM', Sequelize.col('Venta.total')), 'DESC']]  // ✅ Calificar columna
    });

    res.json({
      success: true,
      data: {
        total_ventas: totalVentas,
        ventas_completadas: ventasCompletadas,
        ventas_anuladas: ventasAnuladas,
        total_ingresos: totalIngresos || 0,
        ingresos_hoy: totalIngresosHoy || 0,
        metodos_pago: metodosPago
      }
    });
  } catch (error) {
    console.error('Error en getEstadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message  // ✅ Agregar mensaje de error para debug
    });
  }
};

module.exports = {
  // Clientes (proxy a cliente-service)
  getClientes,
  getClienteById,
  getClienteByDocumento,
  createCliente,
  // Métodos de pago
  getMetodosPago,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago,
  // Ventas
  registrarVenta,
  getVentas,
  getVentaById,
  anularVenta,
  getVentasByCliente,
  getVentasDelDia,
  getProductosMasVendidos,
  // Estadísticas
  getEstadisticas
};