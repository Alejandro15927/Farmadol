const { Categoria, Producto, Inventario, MovimientoInventario } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ CATEGORÍAS ============

// Obtener todas las categorías
const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { estado: true },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear categoría
const createCategoria = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nombre, descripcion } = req.body;

    const existing = await Categoria.findOne({ where: { nombre } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const categoria = await Categoria.create({ nombre, descripcion });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: categoria
    });
  } catch (error) {
    console.error('Error en createCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ PRODUCTOS ============

// Obtener todos los productos
const getProductos = async (req, res) => {
  try {
    const { categoria_id, estado } = req.query;
    const where = {};

    if (categoria_id) where.categoria_id = categoria_id;
    if (estado !== undefined) where.estado = estado === 'true';

    const productos = await Producto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria' }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto por ID
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' }
      ]
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: producto
    });
  } catch (error) {
    console.error('Error en getProductoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear producto
const createProducto = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      codigo, nombre, descripcion, categoria_id, 
      precio_compra, precio_venta, requiere_receta,
      stock_minimo, stock_maximo, unidad_medida 
    } = req.body;

    // Verificar código único
    const existing = await Producto.findOne({ where: { codigo } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese código'
      });
    }

    // Verificar categoría
    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const producto = await Producto.create({
      codigo,
      nombre,
      descripcion,
      categoria_id,
      precio_compra: precio_compra || 0,
      precio_venta: precio_venta || 0,
      requiere_receta: requiere_receta || false,
      stock_minimo: stock_minimo || 10,
      stock_maximo: stock_maximo || 500,
      unidad_medida: unidad_medida || 'unidad',
      estado: true
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: producto
    });
  } catch (error) {
    console.error('Error en createProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
const updateProducto = async (req, res) => {
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
      codigo, nombre, descripcion, categoria_id, 
      precio_compra, precio_venta, requiere_receta,
      stock_minimo, stock_maximo, unidad_medida, estado 
    } = req.body;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar código único
    if (codigo !== producto.codigo) {
      const existing = await Producto.findOne({
        where: { codigo, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con ese código'
        });
      }
    }

    // Verificar categoría
    if (categoria_id) {
      const categoria = await Categoria.findByPk(categoria_id);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }
    }

    await producto.update({
      codigo,
      nombre,
      descripcion,
      categoria_id,
      precio_compra,
      precio_venta,
      requiere_receta,
      stock_minimo,
      stock_maximo,
      unidad_medida,
      estado,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });
  } catch (error) {
    console.error('Error en updateProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ INVENTARIO ============

// Consultar stock por producto y sucursal
const getStock = async (req, res) => {
  try {
    const { producto_id, sucursal_id } = req.query;

    if (!producto_id || !sucursal_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren producto_id y sucursal_id'
      });
    }

    const inventario = await Inventario.findAll({
      where: {
        producto_id,
        sucursal_id,
        estado: 'activo',
        cantidad: { [Op.gt]: 0 }
      },
      order: [['fecha_vencimiento', 'ASC']]
    });

    const totalStock = inventario.reduce((sum, item) => sum + item.cantidad_disponible, 0);

    res.json({
      success: true,
      data: {
        producto_id: parseInt(producto_id),
        sucursal_id: parseInt(sucursal_id),
        total_stock: totalStock,
        lotes: inventario
      }
    });
  } catch (error) {
    console.error('Error en getStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Consultar stock por producto en todas las sucursales
const getStockAllSucursales = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const inventario = await Inventario.findAll({
      where: {
        producto_id,
        estado: 'activo',
        cantidad: { [Op.gt]: 0 }
      },
      order: [['sucursal_id', 'ASC'], ['fecha_vencimiento', 'ASC']]
    });

    // Agrupar por sucursal
    const stockPorSucursal = {};
    inventario.forEach(item => {
      if (!stockPorSucursal[item.sucursal_id]) {
        stockPorSucursal[item.sucursal_id] = {
          sucursal_id: item.sucursal_id,
          total: 0,
          lotes: []
        };
      }
      stockPorSucursal[item.sucursal_id].total += item.cantidad_disponible;
      stockPorSucursal[item.sucursal_id].lotes.push(item);
    });

    res.json({
      success: true,
      data: Object.values(stockPorSucursal)
    });
  } catch (error) {
    console.error('Error en getStockAllSucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar entrada de inventario (compra)
const registrarEntrada = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      producto_id, sucursal_id, lote, cantidad, 
      fecha_vencimiento, costo_unitario, referencia_id,
      observaciones 
    } = req.body;

    const usuario_id = req.user.id;

    // Verificar producto
    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si ya existe el lote
    let inventario = await Inventario.findOne({
      where: {
        producto_id,
        sucursal_id,
        lote,
        fecha_vencimiento,
        estado: 'activo'
      }
    });

    if (inventario) {
      // Actualizar cantidad existente
      const cantidadAnterior = inventario.cantidad;
      const nuevaCantidad = cantidadAnterior + cantidad;
      
      await inventario.update({
        cantidad: nuevaCantidad,
        cantidad_disponible: nuevaCantidad,
        costo_unitario: costo_unitario,
        fecha_actualizacion: new Date()
      });

      // Registrar movimiento
      await MovimientoInventario.create({
        inventario_id: inventario.id,
        tipo_movimiento: 'entrada',
        cantidad,
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: nuevaCantidad,
        referencia_tipo: 'compra',
        referencia_id,
        usuario_id,
        observaciones: observaciones || 'Entrada por compra',
        fecha_movimiento: new Date()
      });
    } else {
      // Crear nuevo registro
      inventario = await Inventario.create({
        producto_id,
        sucursal_id,
        lote,
        cantidad,
        cantidad_reservada: 0,
        cantidad_disponible: cantidad,
        fecha_vencimiento,
        costo_unitario,
        estado: 'activo'
      });

      // Registrar movimiento
      await MovimientoInventario.create({
        inventario_id: inventario.id,
        tipo_movimiento: 'entrada',
        cantidad,
        cantidad_anterior: 0,
        cantidad_nueva: cantidad,
        referencia_tipo: 'compra',
        referencia_id,
        usuario_id,
        observaciones: observaciones || 'Entrada por compra',
        fecha_movimiento: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: inventario
    });
  } catch (error) {
    console.error('Error en registrarEntrada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar salida de inventario (venta)
const registrarSalida = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      producto_id, sucursal_id, cantidad, 
      referencia_id, observaciones 
    } = req.body;

    const usuario_id = req.user.id;

    // Verificar stock disponible
    const inventarioItems = await Inventario.findAll({
      where: {
        producto_id,
        sucursal_id,
        estado: 'activo',
        cantidad: { [Op.gt]: 0 },
        cantidad_disponible: { [Op.gt]: 0 }
      },
      order: [['fecha_vencimiento', 'ASC']]
    });

    if (inventarioItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay stock disponible para este producto'
      });
    }

    let cantidadRestante = cantidad;
    const movimientos = [];

    // Descontar de los lotes (FIFO)
    for (const item of inventarioItems) {
      if (cantidadRestante <= 0) break;

      const disponible = item.cantidad_disponible;
      const cantidadADescontar = Math.min(cantidadRestante, disponible);

      const cantidadAnterior = item.cantidad;
      const nuevaCantidad = item.cantidad - cantidadADescontar;
      const nuevaDisponible = item.cantidad_disponible - cantidadADescontar;

      await item.update({
        cantidad: nuevaCantidad,
        cantidad_disponible: nuevaDisponible,
        fecha_actualizacion: new Date()
      });

      // Registrar movimiento
      const movimiento = await MovimientoInventario.create({
        inventario_id: item.id,
        tipo_movimiento: 'salida',
        cantidad: cantidadADescontar,
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: nuevaCantidad,
        referencia_tipo: 'venta',
        referencia_id,
        usuario_id,
        observaciones: observaciones || 'Salida por venta',
        fecha_movimiento: new Date()
      });

      movimientos.push(movimiento);
      cantidadRestante -= cantidadADescontar;
    }

    if (cantidadRestante > 0) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Faltan ${cantidadRestante} unidades`,
        movimientos
      });
    }

    res.json({
      success: true,
      message: 'Salida de stock registrada exitosamente',
      data: movimientos
    });
  } catch (error) {
    console.error('Error en registrarSalida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Reservar stock para una venta
const reservarStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { producto_id, sucursal_id, cantidad } = req.body;

    // Verificar stock disponible
    const inventarioItems = await Inventario.findAll({
      where: {
        producto_id,
        sucursal_id,
        estado: 'activo',
        cantidad_disponible: { [Op.gt]: 0 }
      },
      order: [['fecha_vencimiento', 'ASC']]
    });

    let totalDisponible = inventarioItems.reduce((sum, item) => sum + item.cantidad_disponible, 0);

    if (totalDisponible < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${totalDisponible}, Requerido: ${cantidad}`
      });
    }

    let cantidadRestante = cantidad;
    const reservas = [];

    for (const item of inventarioItems) {
      if (cantidadRestante <= 0) break;

      const disponible = item.cantidad_disponible;
      const cantidadAReservar = Math.min(cantidadRestante, disponible);

      await item.update({
        cantidad_reservada: item.cantidad_reservada + cantidadAReservar,
        cantidad_disponible: item.cantidad_disponible - cantidadAReservar,
        fecha_actualizacion: new Date()
      });

      reservas.push({
        inventario_id: item.id,
        lote: item.lote,
        cantidad: cantidadAReservar,
        costo_unitario: item.costo_unitario
      });

      cantidadRestante -= cantidadAReservar;
    }

    res.json({
      success: true,
      message: 'Stock reservado exitosamente',
      data: {
        reservas,
        total_reservado: cantidad
      }
    });
  } catch (error) {
    console.error('Error en reservarStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Liberar reserva de stock
const liberarReserva = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { producto_id, sucursal_id, cantidad } = req.body;

    const inventarioItems = await Inventario.findAll({
      where: {
        producto_id,
        sucursal_id,
        cantidad_reservada: { [Op.gt]: 0 }
      },
      order: [['fecha_vencimiento', 'ASC']]
    });

    let cantidadRestante = cantidad;

    for (const item of inventarioItems) {
      if (cantidadRestante <= 0) break;

      const reservada = item.cantidad_reservada;
      const cantidadALiberar = Math.min(cantidadRestante, reservada);

      await item.update({
        cantidad_reservada: item.cantidad_reservada - cantidadALiberar,
        cantidad_disponible: item.cantidad_disponible + cantidadALiberar,
        fecha_actualizacion: new Date()
      });

      cantidadRestante -= cantidadALiberar;
    }

    res.json({
      success: true,
      message: 'Reserva liberada exitosamente'
    });
  } catch (error) {
    console.error('Error en liberarReserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar productos próximos a vencer
const getProductosProximosVencer = async (req, res) => {
  try {
    const { dias = 30, sucursal_id } = req.query;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + parseInt(dias));

    const where = {
      estado: 'activo',
      fecha_vencimiento: {
        [Op.between]: [new Date(), fechaLimite]
      },
      cantidad: { [Op.gt]: 0 }
    };

    if (sucursal_id) where.sucursal_id = sucursal_id;

    const inventario = await Inventario.findAll({
      where,
      include: [
        { model: Producto, as: 'producto' }
      ],
      order: [['fecha_vencimiento', 'ASC']]
    });

    res.json({
      success: true,
      data: inventario
    });
  } catch (error) {
    console.error('Error en getProductosProximosVencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar productos con stock bajo
const getProductosStockBajo = async (req, res) => {
  try {
    const { sucursal_id } = req.query;

    const where = {
      estado: 'activo'
    };

    if (sucursal_id) where.sucursal_id = sucursal_id;

    const inventario = await Inventario.findAll({
      where,
      include: [
        { model: Producto, as: 'producto' }
      ]
    });

    // Filtrar productos con stock bajo
    const stockBajo = inventario.filter(item => {
      const totalDisponible = item.cantidad_disponible;
      const stockMinimo = item.producto.stock_minimo || 10;
      return totalDisponible <= stockMinimo;
    });

    res.json({
      success: true,
      data: stockBajo
    });
  } catch (error) {
    console.error('Error en getProductosStockBajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Transferir stock entre sucursales
const transferirStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      producto_id, sucursal_origen_id, sucursal_destino_id, 
      lote, cantidad, fecha_vencimiento, costo_unitario,
      referencia_id, observaciones 
    } = req.body;

    const usuario_id = req.user.id;

    // 1. Verificar stock en origen
    const inventarioOrigen = await Inventario.findOne({
      where: {
        producto_id,
        sucursal_id: sucursal_origen_id,
        lote,
        estado: 'activo'
      }
    });

    if (!inventarioOrigen) {
      return res.status(404).json({
        success: false,
        message: 'Lote no encontrado en sucursal origen'
      });
    }

    if (inventarioOrigen.cantidad_disponible < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente en origen. Disponible: ${inventarioOrigen.cantidad_disponible}`
      });
    }

    // 2. Descontar del origen
    const cantidadAnteriorOrigen = inventarioOrigen.cantidad;
    const nuevaCantidadOrigen = inventarioOrigen.cantidad - cantidad;

    await inventarioOrigen.update({
      cantidad: nuevaCantidadOrigen,
      cantidad_disponible: inventarioOrigen.cantidad_disponible - cantidad,
      fecha_actualizacion: new Date()
    });

    // Movimiento en origen
    await MovimientoInventario.create({
      inventario_id: inventarioOrigen.id,
      tipo_movimiento: 'transferencia_origen',
      cantidad,
      cantidad_anterior: cantidadAnteriorOrigen,
      cantidad_nueva: nuevaCantidadOrigen,
      referencia_tipo: 'transferencia',
      referencia_id,
      usuario_id,
      observaciones: `Transferencia a sucursal ${sucursal_destino_id} - ${observaciones || ''}`,
      fecha_movimiento: new Date()
    });

    // 3. Agregar al destino
    let inventarioDestino = await Inventario.findOne({
      where: {
        producto_id,
        sucursal_id: sucursal_destino_id,
        lote,
        fecha_vencimiento,
        estado: 'activo'
      }
    });

    if (inventarioDestino) {
      // Actualizar existente
      const cantidadAnteriorDestino = inventarioDestino.cantidad;
      const nuevaCantidadDestino = inventarioDestino.cantidad + cantidad;

      await inventarioDestino.update({
        cantidad: nuevaCantidadDestino,
        cantidad_disponible: inventarioDestino.cantidad_disponible + cantidad,
        costo_unitario: costo_unitario || inventarioDestino.costo_unitario,
        fecha_actualizacion: new Date()
      });

      await MovimientoInventario.create({
        inventario_id: inventarioDestino.id,
        tipo_movimiento: 'transferencia_destino',
        cantidad,
        cantidad_anterior: cantidadAnteriorDestino,
        cantidad_nueva: nuevaCantidadDestino,
        referencia_tipo: 'transferencia',
        referencia_id,
        usuario_id,
        observaciones: `Transferencia desde sucursal ${sucursal_origen_id} - ${observaciones || ''}`,
        fecha_movimiento: new Date()
      });
    } else {
      // Crear nuevo registro
      inventarioDestino = await Inventario.create({
        producto_id,
        sucursal_id: sucursal_destino_id,
        lote,
        cantidad,
        cantidad_reservada: 0,
        cantidad_disponible: cantidad,
        fecha_vencimiento,
        costo_unitario: costo_unitario || 0,
        estado: 'activo'
      });

      await MovimientoInventario.create({
        inventario_id: inventarioDestino.id,
        tipo_movimiento: 'transferencia_destino',
        cantidad,
        cantidad_anterior: 0,
        cantidad_nueva: cantidad,
        referencia_tipo: 'transferencia',
        referencia_id,
        usuario_id,
        observaciones: `Transferencia desde sucursal ${sucursal_origen_id} - ${observaciones || ''}`,
        fecha_movimiento: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Transferencia completada exitosamente',
      data: {
        origen: inventarioOrigen,
        destino: inventarioDestino
      }
    });
  } catch (error) {
    console.error('Error en transferirStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener movimientos de inventario
const getMovimientos = async (req, res) => {
  try {
    const { producto_id, sucursal_id, fecha_inicio, fecha_fin } = req.query;
    const where = {};

    if (producto_id) {
      const inventarioIds = await Inventario.findAll({
        where: { producto_id },
        attributes: ['id']
      });
      where.inventario_id = inventarioIds.map(i => i.id);
    }

    if (sucursal_id) {
      const inventarioIds = await Inventario.findAll({
        where: { sucursal_id },
        attributes: ['id']
      });
      if (where.inventario_id) {
        where.inventario_id = where.inventario_id.filter(id => inventarioIds.map(i => i.id).includes(id));
      } else {
        where.inventario_id = inventarioIds.map(i => i.id);
      }
    }

    if (fecha_inicio && fecha_fin) {
      where.fecha_movimiento = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const movimientos = await MovimientoInventario.findAll({
      where,
      include: [
        { 
          model: Inventario, 
          as: 'inventario',
          include: [
            { model: Producto, as: 'producto' }
          ]
        }
      ],
      order: [['fecha_movimiento', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error en getMovimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  // Categorías
  getCategorias,
  createCategoria,
  // Productos
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  // Inventario
  getStock,
  getStockAllSucursales,
  registrarEntrada,
  registrarSalida,
  reservarStock,
  liberarReserva,
  getProductosProximosVencer,
  getProductosStockBajo,
  transferirStock,
  getMovimientos
};