const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Alerta = require('./Alerta')(sequelize);
const Reporte = require('./Reporte')(sequelize);

module.exports = {
  sequelize,
  Alerta,
  Reporte
};