const { Proveedor, Compra, CompraDetalle } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ PROVEEDORES ============

// Obtener todos los proveedores
const getProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      where: { estado: true },
      order: [['razon_social', 'ASC']]
    });

    res.json({
      success: true,
      data: proveedores
    });
  } catch (error) {
    console.error('Error en getProveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener proveedor por ID
const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    console.error('Error en getProveedorById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear proveedor
const createProveedor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { ruc, razon_social, nombre_comercial, direccion, telefono, email, contacto_nombre, contacto_telefono, contacto_email } = req.body;

    // Verificar si ya existe un proveedor con el mismo RUC
    const existing = await Proveedor.findOne({ where: { ruc } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proveedor con ese RUC'
      });
    }

    const proveedor = await Proveedor.create({
      ruc,
      razon_social,
      nombre_comercial,
      direccion,
      telefono,
      email,
      contacto_nombre,
      contacto_telefono,
      contacto_email,
      estado: true
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: proveedor
    });
  } catch (error) {
    console.error('Error en createProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar proveedor
const updateProveedor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { ruc, razon_social, nombre_comercial, direccion, telefono, email, contacto_nombre, contacto_telefono, contacto_email, estado } = req.body;

    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar duplicados
    if (ruc !== proveedor.ruc) {
      const existing = await Proveedor.findOne({
        where: { ruc, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro proveedor con ese RUC'
        });
      }
    }

    await proveedor.update({
      ruc,
      razon_social,
      nombre_comercial,
      direccion,
      telefono,
      email,
      contacto_nombre,
      contacto_telefono,
      contacto_email,
      estado,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedor
    });
  } catch (error) {
    console.error('Error en updateProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar proveedor (lógica)
const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    await proveedor.update({
      estado: false,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ COMPRAS ============

// Registrar una compra
const registrarCompra = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      numero_factura, 
      proveedor_id, 
      sucursal_id, 
      fecha_factura,
      tipo_pago,
      plazo_credito,
      observaciones,
      detalles 
    } = req.body;

    const usuario_id = req.user.id;

    // Verificar que el proveedor existe
    const proveedor = await Proveedor.findByPk(proveedor_id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar que no exista la factura
    const existing = await Compra.findOne({ where: { numero_factura } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una compra con ese número de factura'
      });
    }

    // Calcular totales
    let subtotal = 0;
    const detallesCompra = [];

    for (const detalle of detalles) {
      const subtotalItem = detalle.cantidad * detalle.costo_unitario;
      const descuento = detalle.descuento || 0;
      const totalItem = subtotalItem - descuento;
      
      subtotal += totalItem;
      
      detallesCompra.push({
        producto_id: detalle.producto_id,
        lote: detalle.lote,
        fecha_vencimiento: detalle.fecha_vencimiento,
        cantidad: detalle.cantidad,
        costo_unitario: detalle.costo_unitario,
        subtotal: subtotalItem,
        descuento: descuento,
        total: totalItem
      });
    }

    // Calcular IGV (18%)
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Crear la compra
    const compra = await Compra.create({
      numero_factura,
      proveedor_id,
      sucursal_id,
      usuario_id,
      fecha_factura: fecha_factura || new Date(),
      subtotal,
      igv,
      total,
      tipo_pago: tipo_pago || 'contado',
      plazo_credito: plazo_credito || null,
      estado: 'pendiente',
      observaciones
    });

    // Crear los detalles
    for (const detalle of detallesCompra) {
      await CompraDetalle.create({
        compra_id: compra.id,
        ...detalle
      });
    }

    // Obtener la compra completa con detalles
    const compraCompleta = await Compra.findByPk(compra.id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: CompraDetalle, as: 'detalles' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: compraCompleta
    });
  } catch (error) {
    console.error('Error en registrarCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todas las compras
const getCompras = async (req, res) => {
  try {
    const { estado, proveedor_id, sucursal_id, fecha_inicio, fecha_fin } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_compra = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const compras = await Compra.findAll({
      where,
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: CompraDetalle, as: 'detalles' }
      ],
      order: [['fecha_compra', 'DESC']]
    });

    res.json({
      success: true,
      data: compras
    });
  } catch (error) {
    console.error('Error en getCompras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener compra por ID
const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: CompraDetalle, as: 'detalles' }
      ]
    });

    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      data: compra
    });
  } catch (error) {
    console.error('Error en getCompraById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado de compra
const updateEstadoCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    const compra = await Compra.findByPk(id);
    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    await compra.update({
      estado,
      observaciones: observaciones || compra.observaciones,
      fecha_actualizacion: new Date()
    });

    // Si la compra se recibe, actualizar inventario (esto se haría con el servicio de inventario)
    if (estado === 'recibido') {
      // Aquí se integraría con el microservicio de Inventario
      console.log(`📦 Compra ${id} recibida - Actualizar inventario`);
    }

    res.json({
      success: true,
      message: `Estado de compra actualizado a ${estado}`,
      data: compra
    });
  } catch (error) {
    console.error('Error en updateEstadoCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener compras por proveedor
const getComprasByProveedor = async (req, res) => {
  try {
    const { proveedor_id } = req.params;

    const compras = await Compra.findAll({
      where: { proveedor_id },
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: CompraDetalle, as: 'detalles' }
      ],
      order: [['fecha_compra', 'DESC']]
    });

    res.json({
      success: true,
      data: compras
    });
  } catch (error) {
    console.error('Error en getComprasByProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar compra completa (solo si está pendiente)
const updateCompra = async (req, res) => {
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
      numero_factura, 
      proveedor_id, 
      sucursal_id, 
      fecha_factura,
      tipo_pago,
      plazo_credito,
      observaciones,
      estado,
      detalles 
    } = req.body;

    const compra = await Compra.findByPk(id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: CompraDetalle, as: 'detalles' }
      ]
    });

    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Solo permitir editar si está pendiente
    if (compra.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una compra que ya fue procesada'
      });
    }

    // Verificar que el proveedor existe
    const proveedor = await Proveedor.findByPk(proveedor_id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar que no exista otra factura con el mismo número
    const existing = await Compra.findOne({
      where: { 
        numero_factura, 
        id: { [Op.ne]: id } 
      }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe otra compra con ese número de factura'
      });
    }

    // Eliminar detalles antiguos
    await CompraDetalle.destroy({
      where: { compra_id: id }
    });

    // Calcular totales
    let subtotal = 0;
    const detallesCompra = [];

    for (const detalle of detalles) {
      const subtotalItem = detalle.cantidad * detalle.costo_unitario;
      const descuento = detalle.descuento || 0;
      const totalItem = subtotalItem - descuento;
      
      subtotal += totalItem;
      
      detallesCompra.push({
        compra_id: compra.id,
        producto_id: detalle.producto_id,
        lote: detalle.lote,
        fecha_vencimiento: detalle.fecha_vencimiento,
        cantidad: detalle.cantidad,
        costo_unitario: detalle.costo_unitario,
        subtotal: subtotalItem,
        descuento: descuento,
        total: totalItem
      });
    }

    // Calcular IGV (18%)
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Actualizar la compra
    await compra.update({
      numero_factura,
      proveedor_id,
      sucursal_id,
      fecha_factura: fecha_factura || compra.fecha_factura,
      subtotal,
      igv,
      total,
      tipo_pago: tipo_pago || 'contado',
      plazo_credito: plazo_credito || null,
      observaciones: observaciones || compra.observaciones,
      estado: estado || compra.estado,
      fecha_actualizacion: new Date()
    });

    // Crear los nuevos detalles
    for (const detalle of detallesCompra) {
      await CompraDetalle.create(detalle);
    }

    // Obtener la compra completa con detalles
    const compraCompleta = await Compra.findByPk(compra.id, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: CompraDetalle, as: 'detalles' }
      ]
    });

    res.json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: compraCompleta
    });
  } catch (error) {
    console.error('Error en updateCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


module.exports = {
  // Proveedores
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  // Compras
  registrarCompra,
  getCompras,
  getCompraById,
  updateEstadoCompra,
  getComprasByProveedor,
  updateCompra
};