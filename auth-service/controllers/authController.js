const { Usuario, Rol, UsuarioRol } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');

// ============ AUTENTICACIÓN ============

const initAdmin = async (req, res) => {
  try {
    const adminEmail = 'admin@farmadol.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    // Verificar si ya existe el usuario admin
    const existingUser = await Usuario.findOne({
      where: {
        [Op.or]: [
          { email: adminEmail },
          { username: adminUsername }
        ]
      }
    });

    if (existingUser) {
      return res.json({
        success: true,
        created: false,
        message: 'Usuario administrador ya existe',
        data: {
          email: existingUser.email,
          username: existingUser.username
        }
      });
    }

    // Verificar si existe el rol ADMIN
    let adminRole = await Rol.findByPk(1);
    if (!adminRole) {
      adminRole = await Rol.create({
        id: 1,
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema'
      });
    }

    // Crear usuario administrador
    const hashedPassword = await hashPassword(adminPassword);
    
    const adminUser = await Usuario.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      estado: true
    });

    await UsuarioRol.create({
      usuario_id: adminUser.id,
      rol_id: adminRole.id
    });

    console.log('✅ Usuario administrador creado:', adminEmail);

    res.json({
      success: true,
      created: true,
      message: 'Usuario administrador creado exitosamente',
      data: {
        email: adminEmail,
        username: adminUsername,
        password: adminPassword
      }
    });
  } catch (error) {
    console.error('❌ Error en initAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario administrador',
      error: error.message
    });
  }
};


// Login de usuario
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // ✅ Buscar por username o email (lo que venga)
    const loginIdentifier = username || email;
    
    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Usuario o email requerido'
      });
    }

    console.log(`🔍 Buscando usuario: ${loginIdentifier}`);

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { username: loginIdentifier },
          { email: loginIdentifier }
        ]
      },
      include: [
        {
          model: Rol,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    if (!usuario) {
      console.log(`❌ Usuario no encontrado: ${loginIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    console.log(`✅ Usuario encontrado: ${usuario.username} (${usuario.email})`);

    if (!usuario.estado) {
      console.log(`❌ Usuario deshabilitado: ${usuario.username}`);
      return res.status(401).json({
        success: false,
        message: 'Usuario deshabilitado'
      });
    }

    const isValidPassword = await comparePassword(password, usuario.password);
    if (!isValidPassword) {
      console.log(`❌ Contraseña incorrecta para: ${usuario.username}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    console.log(`✅ Login exitoso para: ${usuario.username}`);

    const token = generateToken({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      sucursal_id: usuario.sucursal_id,
      roles: usuario.roles.map(r => r.nombre)
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          sucursal_id: usuario.sucursal_id,
          roles: usuario.roles.map(r => r.nombre),
          estado: usuario.estado
        }
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


// Logout (cliente elimina token)
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
};

// Verificar token actual
const verifyToken = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [
        {
          model: Rol,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        sucursal_id: usuario.sucursal_id,
        roles: usuario.roles.map(r => r.nombre),
        estado: usuario.estado
      }
    });
  } catch (error) {
    console.error('Error en verifyToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ USUARIOS ============

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const { search, estado, rol_id } = req.query;

    let where = {};
    if (estado !== undefined) where.estado = estado === 'true';
    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const include = [
      {
        model: Rol,
        as: 'roles',
        through: { attributes: [] }
      }
    ];

    if (rol_id) {
      include[0].where = { id: rol_id };
    }

    const usuarios = await Usuario.findAll({
      where,
      include,
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: usuarios.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        sucursal_id: u.sucursal_id,
        estado: u.estado,
        roles: u.roles.map(r => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion
        })),
        fecha_creacion: u.fecha_creacion,
        fecha_actualizacion: u.fecha_actualizacion
      }))
    });
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      include: [
        {
          model: Rol,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        sucursal_id: usuario.sucursal_id,
        estado: usuario.estado,
        roles: usuario.roles.map(r => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion
        })),
        fecha_creacion: usuario.fecha_creacion,
        fecha_actualizacion: usuario.fecha_actualizacion
      }
    });
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear usuario
const createUsuario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, sucursal_id, roles } = req.body;

    // Verificar username único
    const existingUsername = await Usuario.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar email único
    const existingEmail = await Usuario.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está en uso'
      });
    }

    // Verificar roles existen
    if (roles && roles.length > 0) {
      const rolesExistentes = await Rol.findAll({ where: { id: roles } });
      if (rolesExistentes.length !== roles.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más roles no existen'
        });
      }
    }

    const hashedPassword = await hashPassword(password);

    const usuario = await Usuario.create({
      username,
      email,
      password: hashedPassword,
      sucursal_id: sucursal_id || null,
      estado: true
    });

    // Asignar roles
    if (roles && roles.length > 0) {
      const rolRecords = roles.map(rolId => ({
        usuario_id: usuario.id,
        rol_id: rolId
      }));
      await UsuarioRol.bulkCreate(rolRecords);
    }

    const usuarioCreado = await Usuario.findByPk(usuario.id, {
      include: [
        {
          model: Rol,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: usuarioCreado.id,
        username: usuarioCreado.username,
        email: usuarioCreado.email,
        sucursal_id: usuarioCreado.sucursal_id,
        estado: usuarioCreado.estado,
        roles: usuarioCreado.roles.map(r => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion
        }))
      }
    });
  } catch (error) {
    console.error('Error en createUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { username, email, password, sucursal_id, estado, roles } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar username único
    if (username && username !== usuario.username) {
      const existingUsername = await Usuario.findOne({
        where: { username, id: { [Op.ne]: id } }
      });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
    }

    // Verificar email único
    if (email && email !== usuario.email) {
      const existingEmail = await Usuario.findOne({
        where: { email, id: { [Op.ne]: id } }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }

    // Verificar roles existen
    if (roles && roles.length > 0) {
      const rolesExistentes = await Rol.findAll({ where: { id: roles } });
      if (rolesExistentes.length !== roles.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más roles no existen'
        });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (sucursal_id !== undefined) updateData.sucursal_id = sucursal_id;
    if (estado !== undefined) updateData.estado = estado;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    await usuario.update(updateData);

    // Actualizar roles
    if (roles) {
      await UsuarioRol.destroy({ where: { usuario_id: id } });
      if (roles.length > 0) {
        const rolRecords = roles.map(rolId => ({
          usuario_id: id,
          rol_id: rolId
        }));
        await UsuarioRol.bulkCreate(rolRecords);
      }
    }

    const usuarioActualizado = await Usuario.findByPk(id, {
      include: [
        {
          model: Rol,
          as: 'roles',
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        id: usuarioActualizado.id,
        username: usuarioActualizado.username,
        email: usuarioActualizado.email,
        sucursal_id: usuarioActualizado.sucursal_id,
        estado: usuarioActualizado.estado,
        roles: usuarioActualizado.roles.map(r => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion
        }))
      }
    });
  } catch (error) {
    console.error('Error en updateUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar usuario (deshabilitar)
const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await usuario.update({ estado: false });

    res.json({
      success: true,
      message: 'Usuario deshabilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Habilitar usuario
const enableUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await usuario.update({ estado: true });

    res.json({
      success: true,
      message: 'Usuario habilitado exitosamente'
    });
  } catch (error) {
    console.error('Error en enableUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ============ ROLES ============

// Obtener todos los roles
const getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error en getRoles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear rol
const createRol = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nombre, descripcion } = req.body;

    const existingRol = await Rol.findOne({ where: { nombre } });
    if (existingRol) {
      return res.status(400).json({
        success: false,
        message: 'El rol ya existe'
      });
    }

    const rol = await Rol.create({ nombre, descripcion });

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: rol
    });
  } catch (error) {
    console.error('Error en createRol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar rol
const updateRol = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    if (nombre && nombre !== rol.nombre) {
      const existingRol = await Rol.findOne({
        where: { nombre, id: { [Op.ne]: id } }
      });
      if (existingRol) {
        return res.status(400).json({
          success: false,
          message: 'El rol ya existe'
        });
      }
    }

    await rol.update({ nombre, descripcion });

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: rol
    });
  } catch (error) {
    console.error('Error en updateRol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar rol
const deleteRol = async (req, res) => {
  try {
    const { id } = req.params;

    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar si tiene usuarios asociados
    const usuariosConRol = await UsuarioRol.count({ where: { rol_id: id } });
    if (usuariosConRol > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el rol porque tiene usuarios asociados'
      });
    }

    await rol.destroy();

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteRol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  // Autenticación
  initAdmin,
  login,
  logout,
  verifyToken,
  // Usuarios
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  enableUsuario,
  // Roles
  getRoles,
  createRol,
  updateRol,
  deleteRol
};