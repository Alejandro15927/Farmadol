// cliente-service/controllers/clienteController.js
const { Cliente, Direccion, HistorialCompra, FrecuenciaCompra, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ CLIENTES ============

// Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const { 
      search, nivel, estado, fecha_inicio, fecha_fin, 
      min_compras, max_compras, min_gasto, max_gasto,
      limit = 50, offset = 0
    } = req.query;

    const where = {};

    if (search) {
      where[Op.or] = [
        { nombres: { [Op.like]: `%${search}%` } },
        { apellidos: { [Op.like]: `%${search}%` } },
        { numero_documento: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (nivel) where.nivel = nivel;
    if (estado !== undefined) where.estado = estado === 'true';
    
    if (fecha_inicio && fecha_fin) {
      where.fecha_registro = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    if (min_compras) where.total_compras = { [Op.gte]: parseInt(min_compras) };
    if (max_compras) {
      where.total_compras = { 
        ...where.total_compras, 
        [Op.lte]: parseInt(max_compras) 
      };
    }

    if (min_gasto) where.total_gastado = { [Op.gte]: parseFloat(min_gasto) };
    if (max_gasto) {
      where.total_gastado = { 
        ...where.total_gastado, 
        [Op.lte]: parseFloat(max_gasto) 
      };
    }

    const { count, rows } = await Cliente.findAndCountAll({
      where,
      include: [
        { 
          model: Direccion, 
          as: 'direcciones',
          where: { es_principal: true },
          required: false,
          limit: 1
        }
      ],
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']],
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

    const cliente = await Cliente.findByPk(id, {
      include: [
        { model: Direccion, as: 'direcciones' },
        { 
          model: HistorialCompra, 
          as: 'historial_compras',
          limit: 10,
          order: [['fecha_compra', 'DESC']]
        }
      ]
    });

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
      razon_social, email, telefono, telefono_alternativo,
      fecha_nacimiento, genero, estado_civil, ocupacion,
      observaciones
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
      telefono_alternativo,
      fecha_nacimiento,
      genero,
      estado_civil,
      ocupacion,
      fecha_registro: new Date(),
      total_compras: 0,
      total_gastado: 0,
      promedio_gasto: 0,
      puntos: 0,
      nivel: 'bronce',
      estado: true,
      observaciones
    });

    // Si se envían direcciones
    if (req.body.direcciones && req.body.direcciones.length > 0) {
      for (const dir of req.body.direcciones) {
        await Direccion.create({
          cliente_id: cliente.id,
          tipo: dir.tipo || 'casa',
          direccion: dir.direccion,
          referencia: dir.referencia,
          distrito: dir.distrito,
          ciudad: dir.ciudad,
          departamento: dir.departamento,
          codigo_postal: dir.codigo_postal,
          es_principal: dir.es_principal || false
        });
      }
    }

    const clienteCompleto = await Cliente.findByPk(cliente.id, {
      include: [{ model: Direccion, as: 'direcciones' }]
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: clienteCompleto
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
      razon_social, email, telefono, telefono_alternativo,
      fecha_nacimiento, genero, estado_civil, ocupacion,
      estado, observaciones
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
      telefono_alternativo,
      fecha_nacimiento,
      genero,
      estado_civil,
      ocupacion,
      estado,
      observaciones,
      fecha_actualizacion: new Date()
    });

    // Actualizar direcciones si se envían
    if (req.body.direcciones) {
      // Eliminar direcciones existentes
      await Direccion.destroy({ where: { cliente_id: id } });
      
      // Crear nuevas direcciones
      for (const dir of req.body.direcciones) {
        await Direccion.create({
          cliente_id: id,
          tipo: dir.tipo || 'casa',
          direccion: dir.direccion,
          referencia: dir.referencia,
          distrito: dir.distrito,
          ciudad: dir.ciudad,
          departamento: dir.departamento,
          codigo_postal: dir.codigo_postal,
          es_principal: dir.es_principal || false
        });
      }
    }

    const clienteCompleto = await Cliente.findByPk(id, {
      include: [{ model: Direccion, as: 'direcciones' }]
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: clienteCompleto
    });
  } catch (error) {
    console.error('Error en updateCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar cliente (lógica)
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    await cliente.update({
      estado: false,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ DIRECCIONES ============

// Agregar dirección a cliente
const addDireccion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cliente_id } = req.params;
    const { tipo, direccion, referencia, distrito, ciudad, departamento, codigo_postal, es_principal } = req.body;

    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Si es principal, quitar principal de otras direcciones
    if (es_principal) {
      await Direccion.update(
        { es_principal: false },
        { where: { cliente_id, es_principal: true } }
      );
    }

    const direccionNueva = await Direccion.create({
      cliente_id,
      tipo: tipo || 'casa',
      direccion,
      referencia,
      distrito,
      ciudad,
      departamento,
      codigo_postal,
      es_principal: es_principal || false
    });

    res.status(201).json({
      success: true,
      message: 'Dirección agregada exitosamente',
      data: direccionNueva
    });
  } catch (error) {
    console.error('Error en addDireccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener direcciones de un cliente
const getDirecciones = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const direcciones = await Direccion.findAll({
      where: { cliente_id, estado: true },
      order: [['es_principal', 'DESC'], ['fecha_creacion', 'ASC']]
    });

    res.json({
      success: true,
      data: direcciones
    });
  } catch (error) {
    console.error('Error en getDirecciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ HISTORIAL DE COMPRAS ============

// Registrar compra en historial del cliente
const registrarCompra = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cliente_id } = req.params;
    const { 
      venta_id, sucursal_id, fecha_compra, total, 
      productos, unidades, metodo_pago 
    } = req.body;

    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Crear historial
    const historial = await HistorialCompra.create({
      cliente_id,
      venta_id,
      sucursal_id,
      fecha_compra: fecha_compra || new Date(),
      total,
      productos,
      unidades,
      metodo_pago,
      estado: 'completada'
    });

    // Actualizar estadísticas del cliente
    const nuevasCompras = cliente.total_compras + 1;
    const nuevoTotalGastado = parseFloat(cliente.total_gastado) + parseFloat(total);
    const nuevoPromedio = nuevoTotalGastado / nuevasCompras;

    // Calcular puntos (1 punto por cada 10 soles)
    const nuevosPuntos = cliente.puntos + Math.floor(total / 10);

    // Calcular nivel
    let nivel = 'bronce';
    if (nuevoTotalGastado >= 5000) nivel = 'diamante';
    else if (nuevoTotalGastado >= 3000) nivel = 'platino';
    else if (nuevoTotalGastado >= 1500) nivel = 'oro';
    else if (nuevoTotalGastado >= 500) nivel = 'plata';

    await cliente.update({
      total_compras: nuevasCompras,
      total_gastado: nuevoTotalGastado,
      promedio_gasto: nuevoPromedio,
      puntos: nuevosPuntos,
      nivel,
      ultima_compra: new Date(),
      fecha_actualizacion: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Compra registrada en historial',
      data: {
        historial,
        cliente_actualizado: {
          total_compras: nuevasCompras,
          total_gastado: nuevoTotalGastado,
          promedio_gasto: nuevoPromedio,
          puntos: nuevosPuntos,
          nivel
        }
      }
    });
  } catch (error) {
    console.error('Error en registrarCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener historial de compras del cliente
const getHistorialCompras = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { limit = 20, offset = 0, estado } = req.query;

    const where = { cliente_id };
    if (estado) where.estado = estado;

    const { count, rows } = await HistorialCompra.findAndCountAll({
      where,
      order: [['fecha_compra', 'DESC']],
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
    console.error('Error en getHistorialCompras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ FRECUENCIA DE COMPRAS ============

// Actualizar frecuencia de compra de productos
const actualizarFrecuencia = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cliente_id, producto_id, cantidad, total } = req.body;

    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    let frecuencia = await FrecuenciaCompra.findOne({
      where: { cliente_id, producto_id }
    });

    if (frecuencia) {
      // Actualizar existente
      const nuevasCompras = frecuencia.total_compras + 1;
      const nuevasUnidades = frecuencia.total_unidades + cantidad;
      const nuevoGastado = parseFloat(frecuencia.total_gastado) + parseFloat(total);

      // Calcular frecuencia
      let nivelFrecuencia = 'baja';
      if (nuevasCompras >= 10) nivelFrecuencia = 'muy_alta';
      else if (nuevasCompras >= 5) nivelFrecuencia = 'alta';
      else if (nuevasCompras >= 3) nivelFrecuencia = 'media';

      await frecuencia.update({
        total_compras: nuevasCompras,
        total_unidades: nuevasUnidades,
        total_gastado: nuevoGastado,
        ultima_compra: new Date(),
        frecuencia: nivelFrecuencia,
        fecha_actualizacion: new Date()
      });
    } else {
      // Crear nuevo
      frecuencia = await FrecuenciaCompra.create({
        cliente_id,
        producto_id,
        total_compras: 1,
        total_unidades: cantidad,
        total_gastado: total,
        ultima_compra: new Date(),
        frecuencia: 'baja'
      });
    }

    res.json({
      success: true,
      message: 'Frecuencia de compra actualizada',
      data: frecuencia
    });
  } catch (error) {
    console.error('Error en actualizarFrecuencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos más comprados por un cliente
const getProductosFrecuentes = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { limit = 10 } = req.query;

    const productos = await FrecuenciaCompra.findAll({
      where: { cliente_id },
      order: [['total_compras', 'DESC'], ['total_unidades', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error en getProductosFrecuentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ ESTADÍSTICAS Y REPORTES ============

// Obtener estadísticas generales
const getEstadisticas = async (req, res) => {
  try {
    const totalClientes = await Cliente.count({ where: { estado: true } });
    const clientesActivos = await Cliente.count({ 
      where: { 
        estado: true,
        total_compras: { [Op.gt]: 0 }
      } 
    });
    
    const clientesNuevos = await Cliente.count({
      where: {
        estado: true,
        fecha_registro: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // CORRECCIÓN: Usar sequelize correctamente
    const niveles = await Cliente.findAll({
      where: { estado: true },
      attributes: [
        'nivel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      group: ['nivel']
    });

    const totalGastado = await Cliente.sum('total_gastado', { 
      where: { estado: true } 
    });

    // CORRECCIÓN: Usar sequelize correctamente
    const promedioGasto = await Cliente.findOne({
      where: { estado: true, total_compras: { [Op.gt]: 0 } },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('total_gastado')), 'promedio']
      ]
    });

    res.json({
      success: true,
      data: {
        total_clientes: totalClientes,
        clientes_activos: clientesActivos,
        clientes_nuevos_30dias: clientesNuevos,
        total_gastado: totalGastado || 0,
        promedio_gasto: promedioGasto?.dataValues?.promedio || 0,
        niveles: niveles || []
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

// Obtener clientes frecuentes
const getClientesFrecuentes = async (req, res) => {
  try {
    const { limit = 10, min_compras = 3 } = req.query;

    const clientes = await Cliente.findAll({
      where: {
        estado: true,
        total_compras: { [Op.gte]: parseInt(min_compras) }
      },
      include: [
        { 
          model: Direccion, 
          as: 'direcciones',
          where: { es_principal: true },
          required: false,
          limit: 1
        }
      ],
      order: [
        ['total_compras', 'DESC'],
        ['total_gastado', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: clientes
    });
  } catch (error) {
    console.error('Error en getClientesFrecuentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar clientes por documento
const buscarPorDocumento = async (req, res) => {
  try {
    const { numero_documento } = req.query;

    if (!numero_documento) {
      return res.status(400).json({
        success: false,
        message: 'Número de documento requerido'
      });
    }

    const cliente = await Cliente.findOne({
      where: { numero_documento, estado: true },
      include: [
        { model: Direccion, as: 'direcciones' },
        { 
          model: HistorialCompra, 
          as: 'historial_compras',
          limit: 5,
          order: [['fecha_compra', 'DESC']]
        }
      ]
    });

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
    console.error('Error en buscarPorDocumento:', error);
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
  deleteCliente,
  // Direcciones
  addDireccion,
  getDirecciones,
  // Historial
  registrarCompra,
  getHistorialCompras,
  // Frecuencia
  actualizarFrecuencia,
  getProductosFrecuentes,
  // Estadísticas
  getEstadisticas,
  getClientesFrecuentes,
  buscarPorDocumento
};