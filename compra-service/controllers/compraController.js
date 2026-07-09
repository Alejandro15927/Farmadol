const { Proveedor, Compra, CompraDetalle } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const INVENTARIO_SERVICE_URL = process.env.INVENTARIO_SERVICE_URL || 'http://localhost:3004';
const TASA_IGV = 0.18;

// ============ FUNCIONES AUXILIARES ============

async function registrarEntradaInventario(authHeader, compraId, detalles, sucursalId) {
  const resultados = [];
  for (const detalle of detalles) {
    const response = await fetch(`${INVENTARIO_SERVICE_URL}/api/inventario/entrada`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({
        producto_id: detalle.producto_id,
        sucursal_id: sucursalId,
        lote: detalle.lote,
        cantidad: detalle.cantidad,
        fecha_vencimiento: detalle.fecha_vencimiento,
        costo_unitario: detalle.costo_unitario,
        referencia_id: compraId,
        ubicacion_estante: detalle.ubicacion_estante || null,
        observaciones: `Entrada por compra ${compraId}`
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Error al registrar entrada del producto ${detalle.producto_id}`);
    }
    resultados.push(data.data);
  }
  return resultados;
}

// ============ PROVEEDORES ============

// Obtener todos los proveedores
const getProveedores = async (req, res) => {
  try {
    const { search, estado } = req.query;

    let where = {};
    if (estado !== undefined) where.estado = estado === 'true';
    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { razon_social: { [Op.like]: `%${search}%` } },
          { nombre_comercial: { [Op.like]: `%${search}%` } },
          { ruc: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const proveedores = await Proveedor.findAll({
      where,
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

    const {
      ruc,
      razon_social,
      nombre_comercial,
      direccion,
      telefono,
      email,
      contacto_nombre,
      contacto_telefono,
      contacto_email
    } = req.body;

    // Verificar RUC único
    const existingRuc = await Proveedor.findOne({ where: { ruc } });
    if (existingRuc) {
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
    const {
      ruc,
      razon_social,
      nombre_comercial,
      direccion,
      telefono,
      email,
      contacto_nombre,
      contacto_telefono,
      contacto_email,
      estado
    } = req.body;

    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar RUC único
    if (ruc && ruc !== proveedor.ruc) {
      const existingRuc = await Proveedor.findOne({
        where: { ruc, id: { [Op.ne]: id } }
      });
      if (existingRuc) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro proveedor con ese RUC'
        });
      }
    }

    await proveedor.update({
      ruc: ruc || proveedor.ruc,
      razon_social: razon_social || proveedor.razon_social,
      nombre_comercial: nombre_comercial !== undefined ? nombre_comercial : proveedor.nombre_comercial,
      direccion: direccion !== undefined ? direccion : proveedor.direccion,
      telefono: telefono !== undefined ? telefono : proveedor.telefono,
      email: email !== undefined ? email : proveedor.email,
      contacto_nombre: contacto_nombre !== undefined ? contacto_nombre : proveedor.contacto_nombre,
      contacto_telefono: contacto_telefono !== undefined ? contacto_telefono : proveedor.contacto_telefono,
      contacto_email: contacto_email !== undefined ? contacto_email : proveedor.contacto_email,
      estado: estado !== undefined ? estado : proveedor.estado,
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

// Eliminar proveedor (deshabilitar)
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

    // Verificar si tiene compras asociadas
    const compras = await Compra.count({ where: { proveedor_id: id } });
    if (compras > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede deshabilitar el proveedor porque tiene compras asociadas'
      });
    }

    await proveedor.update({
      estado: false,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Proveedor deshabilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Habilitar proveedor
const enableProveedor = async (req, res) => {
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
      estado: true,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Proveedor habilitado exitosamente',
      data: proveedor
    });
  } catch (error) {
    console.error('Error en enableProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener proveedores activos (para dropdowns)
const getProveedoresActivos = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      where: { estado: true },
      attributes: ['id', 'ruc', 'razon_social', 'nombre_comercial'],
      order: [['razon_social', 'ASC']]
    });

    res.json({
      success: true,
      data: proveedores
    });
  } catch (error) {
    console.error('Error en getProveedoresActivos:', error);
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

    // Validar proveedor
    const proveedor = await Proveedor.findByPk(proveedor_id);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Verificar factura única
    const existingFactura = await Compra.findOne({ where: { numero_factura } });
    if (existingFactura) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una compra con ese número de factura'
      });
    }

    // Calcular totales
    let subtotal = 0;
    const detallesCompra = [];

    for (const detalle of detalles) {
      const totalItem = detalle.cantidad * detalle.costo_unitario - (detalle.descuento || 0);
      const subtotalItem = parseFloat((totalItem / (1 + TASA_IGV)).toFixed(2));

      subtotal += totalItem;

      detallesCompra.push({
        producto_id: detalle.producto_id,
        lote: detalle.lote,
        fecha_vencimiento: detalle.fecha_vencimiento,
        cantidad: detalle.cantidad,
        costo_unitario: detalle.costo_unitario,
        descuento: detalle.descuento || 0,
        subtotal: subtotalItem,
        total: totalItem,
        ubicacion_estante: detalle.ubicacion_estante || null
      });
    }

    const totalBruto = subtotal;
    const subtotalFinal = parseFloat((totalBruto / (1 + TASA_IGV)).toFixed(2));
    const igv = parseFloat((totalBruto - subtotalFinal).toFixed(2));

    // Crear la compra con estado 'pendiente' por defecto
    const compra = await Compra.create({
      numero_factura,
      proveedor_id,
      sucursal_id,
      usuario_id,
      fecha_compra: new Date(),
      fecha_factura: fecha_factura || new Date(),
      subtotal: subtotalFinal,
      igv,
      total: totalBruto,
      tipo_pago: tipo_pago || 'contado',
      plazo_credito: plazo_credito || null,
      estado: req.body.estado || 'pendiente', // ✅ Usar el estado enviado desde el frontend
      observaciones
    });

    // Crear los detalles
    for (const detalle of detallesCompra) {
      await CompraDetalle.create({
        compra_id: compra.id,
        ...detalle
      });
    }

    // ✅ SOLO registrar inventario si se envía registrar_inventario=true
    const authHeader = req.headers.authorization;
    if (authHeader && req.body.registrar_inventario === true) {
      try {
        await registrarEntradaInventario(authHeader, compra.id, detalles, sucursal_id);
        await compra.update({ estado: 'recibido' });
      } catch (error) {
        console.error('Error al registrar inventario:', error);
      }
    }

    // Obtener la compra completa con detalles
    const compraCompleta = await Compra.findByPk(compra.id, {
      include: [
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
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
    const {
      estado,
      proveedor_id,
      sucursal_id,
      usuario_id,
      fecha_inicio,
      fecha_fin,
      tipo_pago
    } = req.query;

    const where = {};

    if (estado) where.estado = estado;
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (tipo_pago) where.tipo_pago = tipo_pago;

    if (fecha_inicio && fecha_fin) {
      where.fecha_compra = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const compras = await Compra.findAll({
      where,
      include: [
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
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
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
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

// Actualizar compra
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
      estado,
      observaciones,
      detalles, // ✅ Capturar los detalles
      subtotal,
      igv,
      total
    } = req.body;

    const compra = await Compra.findByPk(id);
    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Verificar factura única
    if (numero_factura && numero_factura !== compra.numero_factura) {
      const existingFactura = await Compra.findOne({
        where: { numero_factura, id: { [Op.ne]: id } }
      });
      if (existingFactura) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra compra con ese número de factura'
        });
      }
    }

    // Verificar proveedor
    if (proveedor_id) {
      const proveedor = await Proveedor.findByPk(proveedor_id);
      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }
    }

    // ✅ Actualizar los campos generales de la compra
    await compra.update({
      numero_factura: numero_factura || compra.numero_factura,
      proveedor_id: proveedor_id || compra.proveedor_id,
      sucursal_id: sucursal_id || compra.sucursal_id,
      fecha_factura: fecha_factura || compra.fecha_factura,
      tipo_pago: tipo_pago || compra.tipo_pago,
      plazo_credito: plazo_credito !== undefined ? plazo_credito : compra.plazo_credito,
      estado: estado || compra.estado,
      observaciones: observaciones !== undefined ? observaciones : compra.observaciones,
      subtotal: subtotal || compra.subtotal,
      igv: igv || compra.igv,
      total: total || compra.total,
      fecha_actualizacion: new Date()
    });

    // ✅ ACTUALIZAR LOS DETALLES
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      // 1. Eliminar los detalles existentes
      await CompraDetalle.destroy({
        where: { compra_id: id }
      });

      // 2. Crear los nuevos detalles
      const detallesCompra = [];
      for (const detalle of detalles) {
        const totalItem = detalle.cantidad * detalle.costo_unitario - (detalle.descuento || 0);
        const subtotalItem = parseFloat((totalItem / (1 + TASA_IGV)).toFixed(2));

        detallesCompra.push({
          compra_id: id,
          producto_id: detalle.producto_id,
          lote: detalle.lote,
          fecha_vencimiento: detalle.fecha_vencimiento,
          cantidad: detalle.cantidad,
          costo_unitario: detalle.costo_unitario,
          descuento: detalle.descuento || 0,
          subtotal: subtotalItem,
          total: totalItem,
          ubicacion_estante: detalle.ubicacion_estante || null
        });
      }

      // 3. Insertar los nuevos detalles
      await CompraDetalle.bulkCreate(detallesCompra);
    }

    // Obtener la compra actualizada con sus detalles
    const compraActualizada = await Compra.findByPk(id, {
      include: [
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: compraActualizada
    });
  } catch (error) {
    console.error('Error en updateCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


// Anular compra
const anularCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const compra = await Compra.findByPk(id);
    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    if (compra.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'La compra ya está cancelada'
      });
    }

    await compra.update({
      estado: 'cancelado',
      observaciones: `CANCELADA: ${observaciones || 'Sin motivo especificado'}`,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Compra cancelada exitosamente',
      data: compra
    });
  } catch (error) {
    console.error('Error en anularCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Confirmar recepción de compra (actualizar inventario)
const confirmarRecepcion = async (req, res) => {
  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id, {
      include: [
        {
          model: CompraDetalle,
          as: 'detalles'
        }
      ]
    });

    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    if (compra.estado === 'recibido') {
      return res.status(400).json({
        success: false,
        message: 'La compra ya fue recibida'
      });
    }

    if (compra.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede recibir una compra cancelada'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado para registrar inventario'
      });
    }

    try {
      const detalles = compra.detalles.map(d => ({
        producto_id: d.producto_id,
        lote: d.lote,
        cantidad: d.cantidad,
        fecha_vencimiento: d.fecha_vencimiento,
        costo_unitario: d.costo_unitario,
        ubicacion_estante: d.ubicacion_estante || null
      }));

      await registrarEntradaInventario(authHeader, compra.id, detalles, compra.sucursal_id);
      await compra.update({
        estado: 'recibido',
        fecha_actualizacion: new Date()
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al registrar el inventario'
      });
    }

    const compraActualizada = await Compra.findByPk(id, {
      include: [
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Compra recibida exitosamente',
      data: compraActualizada
    });
  } catch (error) {
    console.error('Error en confirmarRecepcion:', error);
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
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
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

// Obtener compras del día
const getComprasDelDia = async (req, res) => {
  try {
    const { sucursal_id } = req.query;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const where = {
      fecha_compra: {
        [Op.between]: [hoy, manana]
      }
    };

    if (sucursal_id) where.sucursal_id = sucursal_id;

    const compras = await Compra.findAll({
      where,
      include: [
        {
          model: Proveedor,
          as: 'proveedor'
        },
        {
          model: CompraDetalle,
          as: 'detalles'
        }
      ],
      order: [['fecha_compra', 'DESC']]
    });

    // Calcular resumen del día
    const totalCompras = compras.length;
    const totalMonto = compras.reduce((sum, c) => sum + parseFloat(c.total), 0);
    const totalProductos = compras.reduce((sum, c) => {
      return sum + c.detalles.reduce((s, d) => s + d.cantidad, 0);
    }, 0);

    res.json({
      success: true,
      data: {
        resumen: {
          total_compras: totalCompras,
          total_monto: totalMonto,
          total_productos: totalProductos,
          promedio_compra: totalCompras > 0 ? totalMonto / totalCompras : 0
        },
        compras
      }
    });
  } catch (error) {
    console.error('Error en getComprasDelDia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ ESTADÍSTICAS ============

// Obtener estadísticas de compras
const getEstadisticas = async (req, res) => {
  try {
    const totalProveedores = await Proveedor.count({ where: { estado: true } });
    const totalCompras = await Compra.count();
    const comprasPendientes = await Compra.count({ where: { estado: 'pendiente' } });
    const comprasRecibidas = await Compra.count({ where: { estado: 'recibido' } });
    const comprasCanceladas = await Compra.count({ where: { estado: 'cancelado' } });

    // Suma total de compras
    const totalGastado = await Compra.sum('total', { where: { estado: 'recibido' } });

    // Mejores proveedores
    const proveedoresTop = await Compra.findAll({
      attributes: [
        'proveedor_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_compras'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total_gastado']
      ],
      where: { estado: 'recibido' },
      group: ['proveedor_id'],
      order: [[Sequelize.fn('SUM', Sequelize.col('total')), 'DESC']],
      limit: 5,
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id', 'razon_social', 'ruc']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        total_proveedores: totalProveedores,
        total_compras: totalCompras,
        compras_pendientes: comprasPendientes,
        compras_recibidas: comprasRecibidas,
        compras_canceladas: comprasCanceladas,
        total_gastado: totalGastado || 0,
        mejores_proveedores: proveedoresTop
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

module.exports = {
  // Proveedores
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  enableProveedor,
  getProveedoresActivos,
  // Compras
  registrarCompra,
  getCompras,
  getCompraById,
  updateCompra,
  anularCompra,
  confirmarRecepcion,
  getComprasByProveedor,
  getComprasDelDia,
  // Estadísticas
  getEstadisticas
};