const { Categoria, Producto, Inventario, MovimientoInventario } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ CATEGORÍAS ============

// Obtener todas las categorías
const getCategorias = async (req, res) => {
  try {
    const { estado } = req.query;
    let where = {};
    if (estado !== undefined) where.estado = estado === 'true';

    const categorias = await Categoria.findAll({
      where,
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

// Obtener categoría por ID
const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Error en getCategoriaById:', error);
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

    const categoria = await Categoria.create({
      nombre,
      descripcion,
      estado: true
    });

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

// Actualizar categoría
const updateCategoria = async (req, res) => {
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

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    if (nombre && nombre !== categoria.nombre) {
      const existing = await Categoria.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con ese nombre'
        });
      }
    }

    await categoria.update({
      nombre: nombre || categoria.nombre,
      descripcion: descripcion !== undefined ? descripcion : categoria.descripcion,
      estado: estado !== undefined ? estado : categoria.estado
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoria
    });
  } catch (error) {
    console.error('Error en updateCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar categoría
const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si tiene productos asociados
    const productos = await Producto.count({ where: { categoria_id: id, estado: true } });
    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    await categoria.update({ estado: false });

    res.json({
      success: true,
      message: 'Categoría deshabilitada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteCategoria:', error);
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
    const { search, categoria_id, estado, requiere_receta } = req.query;

    let where = {};
    if (estado !== undefined) where.estado = estado === 'true';
    if (categoria_id) where.categoria_id = categoria_id;
    if (requiere_receta !== undefined) where.requiere_receta = requiere_receta === 'true';

    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { nombre: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } },
          { descripcion: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const productos = await Producto.findAll({
      where,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }
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
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Inventario,
          as: 'inventarios',
          where: { estado: 'activo' },
          required: false
        }
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
      sku,
      codigo,
      nombre,
      descripcion,
      categoria_id,
      precio_compra,
      precio_venta,
      requiere_receta,
      stock_minimo,
      stock_maximo,
      unidad_medida
    } = req.body;

    // Verificar SKU único
    const existingSku = await Producto.findOne({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese SKU'
      });
    }

    // Verificar código único
    const existingCodigo = await Producto.findOne({ where: { codigo } });
    if (existingCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese código'
      });
    }

    // Verificar categoría existe
    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const producto = await Producto.create({
      sku,
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

    const productoCompleto = await Producto.findByPk(producto.id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: productoCompleto
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
      sku,
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
      estado
    } = req.body;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar SKU único
    if (sku && sku !== producto.sku) {
      const existingSku = await Producto.findOne({
        where: { sku, id: { [Op.ne]: id } }
      });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con ese SKU'
        });
      }
    }

    // Verificar código único
    if (codigo && codigo !== producto.codigo) {
      const existingCodigo = await Producto.findOne({
        where: { codigo, id: { [Op.ne]: id } }
      });
      if (existingCodigo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro producto con ese código'
        });
      }
    }

    // Verificar categoría existe
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
      sku: sku || producto.sku,
      codigo: codigo || producto.codigo,
      nombre: nombre || producto.nombre,
      descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
      categoria_id: categoria_id || producto.categoria_id,
      precio_compra: precio_compra !== undefined ? precio_compra : producto.precio_compra,
      precio_venta: precio_venta !== undefined ? precio_venta : producto.precio_venta,
      requiere_receta: requiere_receta !== undefined ? requiere_receta : producto.requiere_receta,
      stock_minimo: stock_minimo !== undefined ? stock_minimo : producto.stock_minimo,
      stock_maximo: stock_maximo !== undefined ? stock_maximo : producto.stock_maximo,
      unidad_medida: unidad_medida || producto.unidad_medida,
      estado: estado !== undefined ? estado : producto.estado,
      fecha_actualizacion: new Date()
    });

    const productoActualizado = await Producto.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: productoActualizado
    });
  } catch (error) {
    console.error('Error en updateProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto (deshabilitar)
const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si tiene movimientos
    const inventarios = await Inventario.findAll({
      where: { producto_id: id }
    });

    for (const inv of inventarios) {
      const movimientos = await MovimientoInventario.count({
        where: { inventario_id: inv.id }
      });
      if (movimientos > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede deshabilitar el producto porque tiene movimientos asociados'
        });
      }
    }

    await producto.update({
      estado: false,
      fecha_actualizacion: new Date()
    });

    // Deshabilitar inventarios asociados
    await Inventario.update(
      { estado: 'bloqueado' },
      { where: { producto_id: id } }
    );

    res.json({
      success: true,
      message: 'Producto deshabilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Habilitar producto
const enableProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await producto.update({
      estado: true,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Producto habilitado exitosamente',
      data: producto
    });
  } catch (error) {
    console.error('Error en enableProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ INVENTARIO ============

// Consultar stock de un producto en una sucursal
const getStock = async (req, res) => {
  try {
    const { producto_id, sucursal_id, lote } = req.query;

    if (!producto_id || !sucursal_id) {
      return res.status(400).json({
        success: false,
        message: 'producto_id y sucursal_id son requeridos'
      });
    }

    let where = {
      producto_id,
      sucursal_id,
      estado: 'activo'
    };

    if (lote) where.lote = lote;

    const inventarios = await Inventario.findAll({
      where,
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'sku', 'codigo']
        }
      ],
      order: [['fecha_vencimiento', 'ASC']]
    });

    const totalStock = inventarios.reduce((sum, inv) => sum + inv.cantidad_disponible, 0);

    res.json({
      success: true,
      data: {
        producto_id: parseInt(producto_id),
        sucursal_id: parseInt(sucursal_id),
        total_stock: totalStock,
        lotes: inventarios
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

// Consultar stock de un producto en todas las sucursales
const getStockGlobal = async (req, res) => {
  try {
    const { producto_id } = req.query;

    if (!producto_id) {
      return res.status(400).json({
        success: false,
        message: 'producto_id es requerido'
      });
    }

    const inventarios = await Inventario.findAll({
      where: {
        producto_id,
        estado: 'activo'
      },
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'sku', 'codigo']
        }
      ],
      order: [['sucursal_id', 'ASC'], ['fecha_vencimiento', 'ASC']]
    });

    // Agrupar por sucursal
    const stockPorSucursal = {};
    let totalGlobal = 0;

    inventarios.forEach(inv => {
      const key = inv.sucursal_id;
      if (!stockPorSucursal[key]) {
        stockPorSucursal[key] = {
          sucursal_id: inv.sucursal_id,
          lotes: [],
          total: 0
        };
      }
      stockPorSucursal[key].lotes.push(inv);
      stockPorSucursal[key].total += inv.cantidad_disponible;
      totalGlobal += inv.cantidad_disponible;
    });

    res.json({
      success: true,
      data: {
        producto_id: parseInt(producto_id),
        total_global: totalGlobal,
        stock_por_sucursal: Object.values(stockPorSucursal)
      }
    });
  } catch (error) {
    console.error('Error en getStockGlobal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar entrada de inventario (compra)
const entradaInventario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      producto_id,
      sucursal_id,
      lote,
      cantidad,
      fecha_vencimiento,
      costo_unitario,
      referencia_id,
      observaciones
    } = req.body;

    const usuario_id = req.user.id;

    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const inventario = await Inventario.create({
      producto_id,
      sucursal_id,
      lote,
      cantidad,
      cantidad_reservada: 0,
      cantidad_disponible: cantidad,
      fecha_vencimiento,
      costo_unitario: costo_unitario || 0,
      ubicacion_estante: req.body.ubicacion_estante || null,
      estado: new Date(fecha_vencimiento) < new Date() ? 'vencido' : 'activo'
    });

    // Registrar movimiento
    await MovimientoInventario.create({
      inventario_id: inventario.id,
      tipo_movimiento: 'entrada',
      cantidad,
      cantidad_anterior: 0,
      cantidad_nueva: cantidad,
      referencia_tipo: 'compra',
      referencia_id: referencia_id || inventario.id,
      usuario_id,
      observaciones: observaciones || 'Entrada por compra'
    });

    res.status(201).json({
      success: true,
      message: 'Entrada de inventario registrada exitosamente',
      data: inventario
    });
  } catch (error) {
    console.error('Error en entradaInventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar salida de inventario (venta)
const salidaInventario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      producto_id,
      sucursal_id,
      cantidad,
      referencia_id,
      observaciones,
      lote_especifico
    } = req.body;

    const usuario_id = req.user.id;

    // Buscar inventario disponible (FIFO)
    let where = {
      producto_id,
      sucursal_id,
      estado: 'activo'
    };

    if (lote_especifico) where.lote = lote_especifico;

    const inventarios = await Inventario.findAll({
      where,
      order: [['fecha_vencimiento', 'ASC']]
    });

    let cantidadRestante = cantidad;
    let movimientos = [];

    for (const inv of inventarios) {
      if (cantidadRestante <= 0) break;

      const disponible = inv.cantidad_disponible;
      const cantidadRetirar = Math.min(cantidadRestante, disponible);

      if (cantidadRetirar > 0) {
        const cantidadAnterior = inv.cantidad_disponible;
        const cantidadNueva = cantidadAnterior - cantidadRetirar;

        await inv.update({
          cantidad: inv.cantidad - cantidadRetirar,
          cantidad_disponible: cantidadNueva,
          estado: cantidadNueva === 0 ? 'agotado' : 'activo',
          fecha_actualizacion: new Date()
        });

        await MovimientoInventario.create({
          inventario_id: inv.id,
          tipo_movimiento: 'salida',
          cantidad: cantidadRetirar,
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: cantidadNueva,
          referencia_tipo: 'venta',
          referencia_id: referencia_id || inv.id,
          usuario_id,
          observaciones: observaciones || 'Salida por venta'
        });

        movimientos.push({
          inventario_id: inv.id,
          lote: inv.lote,
          cantidad_retirada: cantidadRetirar
        });

        cantidadRestante -= cantidadRetirar;
      }
    }

    if (cantidadRestante > 0) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Faltan ${cantidadRestante} unidades`,
        detalles: {
          solicitado: cantidad,
          disponible: cantidad - cantidadRestante,
          faltante: cantidadRestante
        }
      });
    }

    res.json({
      success: true,
      message: 'Salida de inventario registrada exitosamente',
      data: {
        producto_id,
        sucursal_id,
        cantidad_total: cantidad,
        movimientos
      }
    });
  } catch (error) {
    console.error('Error en salidaInventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Transferencia entre sucursales
// Transferencia entre sucursales (CORREGIDO)
const transferenciaInventario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      producto_id,
      sucursal_origen_id,
      sucursal_destino_id,
      cantidad,
      lote,
      observaciones,
      ubicacion_destino  // ✅ Nuevo campo
    } = req.body;

    const usuario_id = req.user.id;

    // Verificar stock en origen
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
        message: 'No se encontró inventario con ese lote en la sucursal origen'
      });
    }

    if (inventarioOrigen.cantidad_disponible < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente en origen. Disponible: ${inventarioOrigen.cantidad_disponible}`
      });
    }

    // Registrar salida en origen
    const cantidadAnteriorOrigen = inventarioOrigen.cantidad_disponible;
    const cantidadNuevaOrigen = cantidadAnteriorOrigen - cantidad;

    await inventarioOrigen.update({
      cantidad: inventarioOrigen.cantidad - cantidad,
      cantidad_disponible: cantidadNuevaOrigen,
      estado: cantidadNuevaOrigen === 0 ? 'agotado' : 'activo',
      fecha_actualizacion: new Date()
    });

    await MovimientoInventario.create({
      inventario_id: inventarioOrigen.id,
      tipo_movimiento: 'transferencia_origen',
      cantidad,
      cantidad_anterior: cantidadAnteriorOrigen,
      cantidad_nueva: cantidadNuevaOrigen,
      referencia_tipo: 'transferencia',
      referencia_id: inventarioOrigen.id,
      usuario_id,
      observaciones: observaciones || `Transferencia a sucursal ${sucursal_destino_id}`
    });

    // ✅ Registrar entrada en destino CON ubicación específica
    const inventarioDestino = await Inventario.create({
      producto_id,
      sucursal_id: sucursal_destino_id,
      lote: inventarioOrigen.lote,
      cantidad,
      cantidad_reservada: 0,
      cantidad_disponible: cantidad,
      fecha_vencimiento: inventarioOrigen.fecha_vencimiento,
      costo_unitario: inventarioOrigen.costo_unitario,
      ubicacion_estante: ubicacion_destino || null,  // ✅ Usar ubicación de destino
      estado: 'activo'
    });

    await MovimientoInventario.create({
      inventario_id: inventarioDestino.id,
      tipo_movimiento: 'transferencia_destino',
      cantidad,
      cantidad_anterior: 0,
      cantidad_nueva: cantidad,
      referencia_tipo: 'transferencia',
      referencia_id: inventarioOrigen.id,
      usuario_id,
      observaciones: observaciones || `Transferencia desde sucursal ${sucursal_origen_id}`
    });

    res.json({
      success: true,
      message: 'Transferencia de inventario realizada exitosamente',
      data: {
        producto_id,
        origen: {
          sucursal_id: sucursal_origen_id,
          stock_restante: cantidadNuevaOrigen
        },
        destino: {
          sucursal_id: sucursal_destino_id,
          stock_ingresado: cantidad,
          ubicacion: ubicacion_destino || 'No especificada'
        }
      }
    });
  } catch (error) {
    console.error('Error en transferenciaInventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ MOVIMIENTOS ============

// Obtener movimientos de inventario
const getMovimientos = async (req, res) => {
  try {
    const { producto_id, sucursal_id, tipo_movimiento, fecha_inicio, fecha_fin } = req.query;

    let where = {};

    if (producto_id) {
      const inventarios = await Inventario.findAll({
        where: { producto_id },
        attributes: ['id']
      });
      const ids = inventarios.map(i => i.id);
      where.inventario_id = { [Op.in]: ids };
    }

    if (sucursal_id) {
      const inventarios = await Inventario.findAll({
        where: { sucursal_id },
        attributes: ['id']
      });
      const ids = inventarios.map(i => i.id);
      where.inventario_id = { [Op.in]: ids };
    }

    if (tipo_movimiento) where.tipo_movimiento = tipo_movimiento;

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
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'nombre', 'sku', 'codigo']
            }
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

// ============ ALERTAS ============

// Obtener productos con stock bajo
const getStockBajo = async (req, res) => {
  try {
    const { sucursal_id } = req.query;

    let where = { estado: 'activo' };
    if (sucursal_id) where.sucursal_id = sucursal_id;

    const inventarios = await Inventario.findAll({
      where,
      include: [
        {
          model: Producto,
          as: 'producto',
          where: { estado: true }
        }
      ]
    });

    // Agrupar por producto y sumar stock
    const stockPorProducto = {};
    inventarios.forEach(inv => {
      const key = inv.producto_id;
      if (!stockPorProducto[key]) {
        stockPorProducto[key] = {
          producto: inv.producto,
          total_stock: 0,
          stock_minimo: inv.producto.stock_minimo,
          sucursales: []
        };
      }
      stockPorProducto[key].total_stock += inv.cantidad_disponible;
      stockPorProducto[key].sucursales.push({
        sucursal_id: inv.sucursal_id,
        stock: inv.cantidad_disponible,
        lote: inv.lote
      });
    });

    // Filtrar los que están por debajo del stock mínimo
    const alertas = Object.values(stockPorProducto)
      .filter(item => item.total_stock <= item.stock_minimo)
      .sort((a, b) => a.total_stock - b.total_stock);

    res.json({
      success: true,
      data: alertas
    });
  } catch (error) {
    console.error('Error en getStockBajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos próximos a vencer
const getProductosPorVencer = async (req, res) => {
  try {
    const { dias = 30, sucursal_id } = req.query;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + parseInt(dias));

    let where = {
      estado: 'activo',
      fecha_vencimiento: {
        [Op.lte]: fechaLimite,
        [Op.gte]: new Date()
      }
    };

    if (sucursal_id) where.sucursal_id = sucursal_id;

    const inventarios = await Inventario.findAll({
      where,
      include: [
        {
          model: Producto,
          as: 'producto',
          where: { estado: true }
        }
      ],
      order: [['fecha_vencimiento', 'ASC']]
    });

    res.json({
      success: true,
      data: inventarios
    });
  } catch (error) {
    console.error('Error en getProductosPorVencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ ESTADÍSTICAS ============

// Obtener estadísticas de inventario
const getEstadisticas = async (req, res) => {
  try {
    const totalProductos = await Producto.count({ where: { estado: true } });
    const totalCategorias = await Categoria.count({ where: { estado: true } });

    const inventariosActivos = await Inventario.findAll({
      where: { estado: 'activo' }
    });

    let totalUnidades = 0;
    let valorInventario = 0;

    inventariosActivos.forEach(inv => {
      totalUnidades += inv.cantidad_disponible;
      valorInventario += inv.cantidad_disponible * parseFloat(inv.costo_unitario);
    });

    const productosVencidos = await Inventario.count({
      where: { estado: 'vencido' }
    });

    const productosAgotados = await Inventario.count({
      where: { estado: 'agotado' }
    });

    // Productos con stock bajo
    const stockBajo = await getStockBajoRaw();

    res.json({
      success: true,
      data: {
        total_productos: totalProductos,
        total_categorias: totalCategorias,
        total_unidades: totalUnidades,
        valor_inventario: valorInventario,
        productos_vencidos: productosVencidos,
        productos_agotados: productosAgotados,
        productos_stock_bajo: stockBajo.length
      }
    });
  } catch (error) {
    console.error('Error en getEstadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Función auxiliar para stock bajo (raw)
const getStockBajoRaw = async () => {
  const inventarios = await Inventario.findAll({
    where: { estado: 'activo' },
    include: [
      {
        model: Producto,
        as: 'producto',
        where: { estado: true }
      }
    ]
  });

  const stockPorProducto = {};
  inventarios.forEach(inv => {
    const key = inv.producto_id;
    if (!stockPorProducto[key]) {
      stockPorProducto[key] = {
        producto: inv.producto,
        total_stock: 0,
        stock_minimo: inv.producto.stock_minimo
      };
    }
    stockPorProducto[key].total_stock += inv.cantidad_disponible;
  });

  return Object.values(stockPorProducto)
    .filter(item => item.total_stock <= item.stock_minimo);
};

module.exports = {
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
};