const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Sucursal = require('./Sucursal')(sequelize);

module.exports = {
  sequelize,
  Sucursal
};