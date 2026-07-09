const { Cliente, Direccion, FrecuenciaCompra, HistorialCompra } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ CLIENTES ============

// Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const { search, estado, nivel, fecha_inicio, fecha_fin } = req.query;

    let where = {};
    if (estado !== undefined) where.estado = estado === 'true';
    if (nivel) where.nivel = nivel;
    if (fecha_inicio && fecha_fin) {
      where.fecha_registro = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }
    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { nombres: { [Op.like]: `%${search}%` } },
          { apellidos: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { telefono: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const clientes = await Cliente.findAll({
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

    const cliente = await Cliente.findByPk(id, {
      include: [
        {
          model: Direccion,
          as: 'direcciones'
        },
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
      direcciones,
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
      tipo_documento: tipo_documento || 'DNI',
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
      observaciones,
      fecha_registro: new Date(),
      estado: true,
      nivel: 'bronce',
      total_compras: 0,
      total_gastado: 0,
      puntos: 0
    });

    // Crear direcciones
    if (direcciones && direcciones.length > 0) {
      const direccionesData = direcciones.map((dir, index) => ({
        ...dir,
        cliente_id: cliente.id,
        es_principal: index === 0 ? true : (dir.es_principal || false)
      }));
      await Direccion.bulkCreate(direccionesData);
    }

    const clienteCompleto = await Cliente.findByPk(cliente.id, {
      include: [
        {
          model: Direccion,
          as: 'direcciones'
        }
      ]
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
      nivel,
      observaciones
    } = req.body;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar duplicados
    if (numero_documento && numero_documento !== cliente.numero_documento) {
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
      tipo_documento: tipo_documento || cliente.tipo_documento,
      numero_documento: numero_documento || cliente.numero_documento,
      nombres: nombres || cliente.nombres,
      apellidos: apellidos || cliente.apellidos,
      razon_social: razon_social !== undefined ? razon_social : cliente.razon_social,
      email: email || cliente.email,
      telefono: telefono || cliente.telefono,
      telefono_alternativo: telefono_alternativo !== undefined ? telefono_alternativo : cliente.telefono_alternativo,
      fecha_nacimiento: fecha_nacimiento || cliente.fecha_nacimiento,
      genero: genero || cliente.genero,
      estado_civil: estado_civil || cliente.estado_civil,
      ocupacion: ocupacion !== undefined ? ocupacion : cliente.ocupacion,
      estado: estado !== undefined ? estado : cliente.estado,
      nivel: nivel || cliente.nivel,
      observaciones: observaciones !== undefined ? observaciones : cliente.observaciones,
      fecha_actualizacion: new Date()
    });

    const clienteActualizado = await Cliente.findByPk(id, {
      include: [
        {
          model: Direccion,
          as: 'direcciones'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: clienteActualizado
    });
  } catch (error) {
    console.error('Error en updateCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar cliente (deshabilitar)
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
      message: 'Cliente deshabilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Habilitar cliente
const enableCliente = async (req, res) => {
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
      estado: true,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Cliente habilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en enableCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar cliente por documento
const getClienteByDocumento = async (req, res) => {
  try {
    const { documento } = req.params;

    const cliente = await Cliente.findOne({
      where: { numero_documento: documento },
      include: [
        {
          model: Direccion,
          as: 'direcciones'
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
    console.error('Error en getClienteByDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener clientes frecuentes
const getClientesFrecuentes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const clientes = await Cliente.findAll({
      where: { estado: true },
      order: [
        ['total_compras', 'DESC'],
        ['total_gastado', 'DESC']
      ],
      limit: parseInt(limit),
      include: [
        {
          model: Direccion,
          as: 'direcciones',
          where: { es_principal: true },
          required: false,
          limit: 1
        }
      ]
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

    // Si es principal, quitar principal a las demás
    if (es_principal) {
      await Direccion.update(
        { es_principal: false },
        { where: { cliente_id, es_principal: true } }
      );
    }

    const nuevaDireccion = await Direccion.create({
      cliente_id,
      tipo: tipo || 'casa',
      direccion,
      referencia,
      distrito,
      ciudad,
      departamento,
      codigo_postal,
      es_principal: es_principal || false,
      estado: true
    });

    res.status(201).json({
      success: true,
      message: 'Dirección agregada exitosamente',
      data: nuevaDireccion
    });
  } catch (error) {
    console.error('Error en addDireccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar dirección
const updateDireccion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { tipo, direccion, referencia, distrito, ciudad, departamento, codigo_postal, es_principal, estado } = req.body;

    const direccionExistente = await Direccion.findByPk(id);
    if (!direccionExistente) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    // Si es principal, quitar principal a las demás
    if (es_principal) {
      await Direccion.update(
        { es_principal: false },
        { where: { cliente_id: direccionExistente.cliente_id, es_principal: true } }
      );
    }

    await direccionExistente.update({
      tipo: tipo || direccionExistente.tipo,
      direccion: direccion || direccionExistente.direccion,
      referencia: referencia !== undefined ? referencia : direccionExistente.referencia,
      distrito: distrito !== undefined ? distrito : direccionExistente.distrito,
      ciudad: ciudad !== undefined ? ciudad : direccionExistente.ciudad,
      departamento: departamento !== undefined ? departamento : direccionExistente.departamento,
      codigo_postal: codigo_postal !== undefined ? codigo_postal : direccionExistente.codigo_postal,
      es_principal: es_principal !== undefined ? es_principal : direccionExistente.es_principal,
      estado: estado !== undefined ? estado : direccionExistente.estado,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Dirección actualizada exitosamente',
      data: direccionExistente
    });
  } catch (error) {
    console.error('Error en updateDireccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar dirección
const deleteDireccion = async (req, res) => {
  try {
    const { id } = req.params;

    const direccion = await Direccion.findByPk(id);
    if (!direccion) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    await direccion.update({ estado: false });

    res.json({
      success: true,
      message: 'Dirección eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteDireccion:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ HISTORIAL DE COMPRAS ============

// Registrar compra en historial
const registrarHistorialCompra = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cliente_id } = req.params;
    const { venta_id, sucursal_id, fecha_compra, total, productos, unidades, metodo_pago } = req.body;

    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

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
    await cliente.update({
      total_compras: cliente.total_compras + 1,
      total_gastado: parseFloat(cliente.total_gastado) + parseFloat(total),
      promedio_gasto: (parseFloat(cliente.total_gastado) + parseFloat(total)) / (cliente.total_compras + 1),
      ultima_compra: new Date(),
      fecha_actualizacion: new Date()
    });

    // Actualizar nivel
    await actualizarNivelCliente(cliente.id);

    res.status(201).json({
      success: true,
      message: 'Historial de compra registrado exitosamente',
      data: historial
    });
  } catch (error) {
    console.error('Error en registrarHistorialCompra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener historial de compras de un cliente
const getHistorialCompras = async (req, res) => {
  try {
    const { cliente_id } = req.params;
    const { limit = 50 } = req.query;

    const historial = await HistorialCompra.findAll({
      where: { cliente_id },
      order: [['fecha_compra', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: historial
    });
  } catch (error) {
    console.error('Error en getHistorialCompras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ FUNCIONES AUXILIARES ============

// Actualizar nivel del cliente según compras
const actualizarNivelCliente = async (clienteId) => {
  try {
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) return;

    const totalGastado = parseFloat(cliente.total_gastado);
    let nivel = 'bronce';

    if (totalGastado >= 5000) nivel = 'diamante';
    else if (totalGastado >= 3000) nivel = 'platino';
    else if (totalGastado >= 1500) nivel = 'oro';
    else if (totalGastado >= 500) nivel = 'plata';

    if (nivel !== cliente.nivel) {
      await cliente.update({ nivel });
    }
  } catch (error) {
    console.error('Error en actualizarNivelCliente:', error);
  }
};

// ============ ESTADÍSTICAS ============

// Obtener estadísticas de clientes
const getEstadisticas = async (req, res) => {
  try {
    const totalClientes = await Cliente.count();
    const clientesActivos = await Cliente.count({ where: { estado: true } });
    
    const niveles = await Cliente.findAll({
      attributes: [
        'nivel',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { estado: true },
      group: ['nivel']
    });

    const totalGastado = await Cliente.sum('total_gastado', { where: { estado: true } });

    res.json({
      success: true,
      data: {
        total_clientes: totalClientes,
        clientes_activos: clientesActivos,
        clientes_inactivos: totalClientes - clientesActivos,
        total_gastado: totalGastado || 0,
        niveles
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
  // Clientes
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  enableCliente,
  getClienteByDocumento,
  getClientesFrecuentes,
  // Direcciones
  addDireccion,
  updateDireccion,
  deleteDireccion,
  // Historial
  registrarHistorialCompra,
  getHistorialCompras,
  // Estadísticas
  getEstadisticas
};