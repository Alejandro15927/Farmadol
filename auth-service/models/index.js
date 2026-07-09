const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Usuario = require('./Usuario')(sequelize);
const Rol = require('./Rol')(sequelize);
const UsuarioRol = require('./UsuarioRol')(sequelize);

// Relaciones Many-to-Many
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: 'usuario_id',
  otherKey: 'rol_id',
  as: 'roles'
});

Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: 'rol_id',
  otherKey: 'usuario_id',
  as: 'usuarios'
});

module.exports = {
  sequelize,
  Usuario,
  Rol,
  UsuarioRol
};