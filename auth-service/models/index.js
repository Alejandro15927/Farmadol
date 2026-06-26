const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const User = require('./User')(sequelize);
const Role = require('./Role')(sequelize);

// Relaciones
User.belongsToMany(Role, { through: 'usuario_roles', foreignKey: 'usuario_id', timestamps: false });
Role.belongsToMany(User, { through: 'usuario_roles', foreignKey: 'rol_id', timestamps: false });

module.exports = {
  sequelize,
  User,
  Role
};