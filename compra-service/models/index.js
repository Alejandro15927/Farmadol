const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Proveedor = require('./Proveedor')(sequelize);
const Compra = require('./Compra')(sequelize);
const CompraDetalle = require('./CompraDetalle')(sequelize);

// Relaciones
Proveedor.hasMany(Compra, { foreignKey: 'proveedor_id', as: 'compras' });
Compra.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

Compra.hasMany(CompraDetalle, { foreignKey: 'compra_id', as: 'detalles' });
CompraDetalle.belongsTo(Compra, { foreignKey: 'compra_id', as: 'compra' });

module.exports = {
  sequelize,
  Proveedor,
  Compra,
  CompraDetalle
};