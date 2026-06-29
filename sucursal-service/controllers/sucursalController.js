const { Sucursal, Transferencia } = require('../models');
const { validationResult } = require('express-validator');

// Obtener todas las sucursales
const getSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.findAll({
      where: { estado: true },
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

// Obtener una sucursal por ID
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

// Crear nueva sucursal
const createSucursal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nombre, codigo, direccion, telefono, email, horario_atencion, encargado } = req.body;

    // Verificar si ya existe una sucursal con el mismo nombre o código
    const existing = await Sucursal.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { nombre },
          { codigo }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una sucursal con ese nombre o código'
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
    const { nombre, codigo, direccion, telefono, email, horario_atencion, encargado, estado } = req.body;

    const sucursal = await Sucursal.findByPk(id);
    if (!sucursal) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }

    // Verificar duplicados
    if (nombre !== sucursal.nombre || codigo !== sucursal.codigo) {
      const existing = await Sucursal.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { nombre },
            { codigo }
          ],
          id: { [require('sequelize').Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra sucursal con ese nombre o código'
        });
      }
    }

    await sucursal.update({
      nombre,
      codigo,
      direccion,
      telefono,
      email,
      horario_atencion,
      encargado,
      estado,
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

// Eliminar sucursal (lógica)
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
      message: 'Sucursal eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteSucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Solicitar transferencia entre sucursales
const solicitarTransferencia = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { sucursal_origen_id, sucursal_destino_id, producto_id, cantidad, lote, fecha_vencimiento, observaciones } = req.body;
    const usuario_solicita = req.user.id;

    // Verificar que las sucursales existen
    const origen = await Sucursal.findByPk(sucursal_origen_id);
    const destino = await Sucursal.findByPk(sucursal_destino_id);

    if (!origen || !destino) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal origen o destino no encontrada'
      });
    }

    if (sucursal_origen_id === sucursal_destino_id) {
      return res.status(400).json({
        success: false,
        message: 'La sucursal origen y destino no pueden ser la misma'
      });
    }

    const transferencia = await Transferencia.create({
      sucursal_origen_id,
      sucursal_destino_id,
      producto_id,
      cantidad,
      lote,
      fecha_vencimiento,
      estado: 'pendiente',
      usuario_solicita,
      observaciones,
      fecha_solicitud: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Transferencia solicitada exitosamente',
      data: transferencia
    });
  } catch (error) {
    console.error('Error en solicitarTransferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener transferencias
const getTransferencias = async (req, res) => {
  try {
    const { estado, sucursal_id } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (sucursal_id) {
      where[require('sequelize').Op.or] = [
        { sucursal_origen_id: sucursal_id },
        { sucursal_destino_id: sucursal_id }
      ];
    }

    const transferencias = await Transferencia.findAll({
      where,
      include: [
        { model: Sucursal, as: 'origen', attributes: ['id', 'nombre', 'codigo'] },
        { model: Sucursal, as: 'destino', attributes: ['id', 'nombre', 'codigo'] }
      ],
      order: [['fecha_solicitud', 'DESC']]
    });

    res.json({
      success: true,
      data: transferencias
    });
  } catch (error) {
    console.error('Error en getTransferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Autorizar transferencia
const autorizarTransferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const usuario_autoriza = req.user.id;

    const transferencia = await Transferencia.findByPk(id);
    if (!transferencia) {
      return res.status(404).json({
        success: false,
        message: 'Transferencia no encontrada'
      });
    }

    if (transferencia.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `La transferencia ya está en estado ${transferencia.estado}`
      });
    }

    await transferencia.update({
      estado: 'en_proceso',
      usuario_autoriza,
      fecha_autorizacion: new Date(),
      observaciones: observaciones || transferencia.observaciones
    });

    // Aquí se integraría con el servicio de Inventario para reservar stock
    // Por ahora solo actualizamos el estado

    res.json({
      success: true,
      message: 'Transferencia autorizada exitosamente',
      data: transferencia
    });
  } catch (error) {
    console.error('Error en autorizarTransferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Completar transferencia
const completarTransferencia = async (req, res) => {
  try {
    const { id } = req.params;

    const transferencia = await Transferencia.findByPk(id);
    if (!transferencia) {
      return res.status(404).json({
        success: false,
        message: 'Transferencia no encontrada'
      });
    }

    if (transferencia.estado !== 'en_proceso') {
      return res.status(400).json({
        success: false,
        message: `La transferencia está en estado ${transferencia.estado}, no se puede completar`
      });
    }

    await transferencia.update({
      estado: 'completada',
      fecha_completada: new Date()
    });

    // Aquí se integraría con Inventario para ejecutar la transferencia
    // Descontar en origen y sumar en destino

    res.json({
      success: true,
      message: 'Transferencia completada exitosamente',
      data: transferencia
    });
  } catch (error) {
    console.error('Error en completarTransferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cancelar transferencia
const cancelarTransferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const transferencia = await Transferencia.findByPk(id);
    if (!transferencia) {
      return res.status(404).json({
        success: false,
        message: 'Transferencia no encontrada'
      });
    }

    if (transferencia.estado === 'completada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una transferencia completada'
      });
    }

    await transferencia.update({
      estado: 'cancelada',
      observaciones: observaciones || transferencia.observaciones
    });

    res.json({
      success: true,
      message: 'Transferencia cancelada exitosamente',
      data: transferencia
    });
  } catch (error) {
    console.error('Error en cancelarTransferencia:', error);
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
  solicitarTransferencia,
  getTransferencias,
  autorizarTransferencia,
  completarTransferencia,
  cancelarTransferencia
};