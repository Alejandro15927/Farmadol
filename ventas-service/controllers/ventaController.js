const { Cliente, MetodoPago, Venta, VentaDetalle } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ CLIENTES ============

// Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const { search } = req.query;
    let where = { estado: true };

    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { nombres: { [Op.like]: `%${search}%` } },
          { apellidos: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const clientes = await Cliente.findAll({
      where,
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });

    res.json({
      success: true,
      data: clientes
    });
  } catch (error) {
    console.error('Error en getClientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener cliente por ID
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Error en getClienteById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear cliente
const createCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      tipo_documento, numero_documento, nombres, apellidos,
      razon_social, email, telefono, direccion, fecha_nacimiento, genero
    } = req.body;

    // Verificar documento único
    const existing = await Cliente.findOne({ where: { numero_documento } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con ese número de documento'
      });
    }

    const cliente = await Cliente.create({
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      email,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      estado: true
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: cliente
    });
  } catch (error) {
    console.error('Error en createCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar cliente
const updateCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { 
      tipo_documento, numero_documento, nombres, apellidos,
      razon_social, email, telefono, direccion, fecha_nacimiento, genero, estado
    } = req.body;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar duplicados
    if (numero_documento !== cliente.numero_documento) {
      const existing = await Cliente.findOne({
        where: { numero_documento, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con ese número de documento'
        });
      }
    }

    await cliente.update({
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      email,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      estado,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: cliente
    });
  } catch (error) {
    console.error('Error en updateCliente:', error);
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
      sucursal_id, cliente_id, metodo_pago_id,
      descuento, monto_recibido, observaciones,
      detalles
    } = req.body;

    const usuario_id = req.user.id;

    // Validar cliente (opcional)
    if (cliente_id) {
      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
    }

    // Validar método de pago
    const metodoPago = await MetodoPago.findByPk(metodo_pago_id);
    if (!metodoPago) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    // Calcular totales
    let subtotal = 0;
    const detallesVenta = [];

    for (const detalle of detalles) {
      const subtotalItem = detalle.cantidad * detalle.precio_unitario;
      const descuentoItem = detalle.descuento || 0;
      const totalItem = subtotalItem - descuentoItem;
      
      subtotal += totalItem;
      
      detallesVenta.push({
        producto_id: detalle.producto_id,
        inventario_id: detalle.inventario_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: descuentoItem,
        subtotal: subtotalItem,
        total: totalItem,
        lote: detalle.lote,
        fecha_vencimiento: detalle.fecha_vencimiento
      });
    }

    // Calcular IGV (18%)
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    const descuentoAplicado = descuento || 0;
    const totalFinal = total - descuentoAplicado;

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

    // Obtener la venta completa con detalles
    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: MetodoPago, as: 'metodo_pago' },
        { model: VentaDetalle, as: 'detalles' }
      ]
    });

    // Aquí se integraría con Inventario Service para descontar stock
    // También se integraría con Reportes para generar comprobante

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
      estado, sucursal_id, cliente_id, usuario_id,
      fecha_inicio, fecha_fin, metodo_pago_id
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
        { model: Cliente, as: 'cliente' },
        { model: MetodoPago, as: 'metodo_pago' },
        { model: VentaDetalle, as: 'detalles' }
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
        { model: Cliente, as: 'cliente' },
        { model: MetodoPago, as: 'metodo_pago' },
        { model: VentaDetalle, as: 'detalles' }
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
        { model: Cliente, as: 'cliente' },
        { model: MetodoPago, as: 'metodo_pago' },
        { model: VentaDetalle, as: 'detalles' }
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
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const where = {
      fecha_venta: {
        [Op.between]: [hoy, mañana]
      },
      estado: 'completada'
    };

    if (sucursal_id) where.sucursal_id = sucursal_id;

    const ventas = await Venta.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente' },
        { model: MetodoPago, as: 'metodo_pago' },
        { model: VentaDetalle, as: 'detalles' }
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

module.exports = {
  // Clientes
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  // Métodos de pago
  getMetodosPago,
  // Ventas
  registrarVenta,
  getVentas,
  getVentaById,
  anularVenta,
  getVentasByCliente,
  getVentasDelDia,
  getProductosMasVendidos
};