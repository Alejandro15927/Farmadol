const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Cliente = require('./Cliente')(sequelize);
const MetodoPago = require('./MetodoPago')(sequelize);
const Venta = require('./Venta')(sequelize);
const VentaDetalle = require('./VentaDetalle')(sequelize);

// Relaciones
Cliente.hasMany(Venta, { foreignKey: 'cliente_id', as: 'ventas' });
Venta.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

MetodoPago.hasMany(Venta, { foreignKey: 'metodo_pago_id', as: 'ventas' });
Venta.belongsTo(MetodoPago, { foreignKey: 'metodo_pago_id', as: 'metodo_pago' });

Venta.hasMany(VentaDetalle, { foreignKey: 'venta_id', as: 'detalles' });
VentaDetalle.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });

module.exports = {
  sequelize,
  Cliente,
  MetodoPago,
  Venta,
  VentaDetalle
};