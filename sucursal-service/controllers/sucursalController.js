const { Sucursal } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// ============ SUCURSALES ============

// Obtener todas las sucursales
const getSucursales = async (req, res) => {
  try {
    const { search, estado } = req.query;

    let where = {};
    if (estado !== undefined) where.estado = estado === 'true';
    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { nombre: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } },
          { direccion: { [Op.like]: `%${search}%` } },
          { encargado: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const sucursales = await Sucursal.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: sucursales
    });
  } catch (error) {
    console.error('Error en getSucursales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener sucursal por ID
const getSucursalById = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await Sucursal.findByPk(id);

    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    res.json({
      success: true,
      data: sucursal
    });
  } catch (error) {
    console.error('Error en getSucursalById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear sucursal
const createSucursal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      nombre, 
      codigo, 
      direccion, 
      telefono, 
      email, 
      horario_atencion, 
      encargado 
    } = req.body;

    // Verificar nombre único
    const existingNombre = await Sucursal.findOne({ where: { nombre } });
    if (existingNombre) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una sucursal con ese nombre'
      });
    }

    // Verificar código único
    const existingCodigo = await Sucursal.findOne({ where: { codigo } });
    if (existingCodigo) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una sucursal con ese código'
      });
    }

    const sucursal = await Sucursal.create({
      nombre,
      codigo,
      direccion,
      telefono,
      email,
      horario_atencion,
      encargado,
      estado: true
    });

    res.status(201).json({
      success: true,
      message: 'Sucursal creada exitosamente',
      data: sucursal
    });
  } catch (error) {
    console.error('Error en createSucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar sucursal
const updateSucursal = async (req, res) => {
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
      nombre, 
      codigo, 
      direccion, 
      telefono, 
      email, 
      horario_atencion, 
      encargado, 
      estado 
    } = req.body;

    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    // Verificar nombre único
    if (nombre && nombre !== sucursal.nombre) {
      const existingNombre = await Sucursal.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });
      if (existingNombre) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra sucursal con ese nombre'
        });
      }
    }

    // Verificar código único
    if (codigo && codigo !== sucursal.codigo) {
      const existingCodigo = await Sucursal.findOne({
        where: { codigo, id: { [Op.ne]: id } }
      });
      if (existingCodigo) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra sucursal con ese código'
        });
      }
    }

    await sucursal.update({
      nombre: nombre || sucursal.nombre,
      codigo: codigo || sucursal.codigo,
      direccion: direccion || sucursal.direccion,
      telefono: telefono || sucursal.telefono,
      email: email || sucursal.email,
      horario_atencion: horario_atencion !== undefined ? horario_atencion : sucursal.horario_atencion,
      encargado: encargado !== undefined ? encargado : sucursal.encargado,
      estado: estado !== undefined ? estado : sucursal.estado,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Sucursal actualizada exitosamente',
      data: sucursal
    });
  } catch (error) {
    console.error('Error en updateSucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar sucursal (deshabilitar)
const deleteSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    await sucursal.update({ 
      estado: false,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Sucursal deshabilitada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteSucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Habilitar sucursal
const enableSucursal = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    await sucursal.update({ 
      estado: true,
      fecha_actualizacion: new Date()
    });

    res.json({
      success: true,
      message: 'Sucursal habilitada exitosamente'
    });
  } catch (error) {
    console.error('Error en enableSucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener sucursales activas (para dropdowns)
const getSucursalesActivas = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({
      where: { estado: true },
      attributes: ['id', 'nombre', 'codigo'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: sucursales
    });
  } catch (error) {
    console.error('Error en getSucursalesActivas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verificar existencia de sucursal
const checkSucursalExists = async (req, res) => {
  try {
    const { id } = req.params;

    const sucursal = await Sucursal.findByPk(id, {
      attributes: ['id', 'nombre', 'codigo', 'estado']
    });

    if (!sucursal) {
      return res.status(404).json({
        success: false,
        exists: false,
        message: 'Sucursal no encontrada'
      });
    }

    res.json({
      success: true,
      exists: true,
      data: sucursal
    });
  } catch (error) {
    console.error('Error en checkSucursalExists:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  enableSucursal,
  getSucursalesActivas,
  checkSucursalExists
};