// cliente-service/models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Cliente = require('./Cliente')(sequelize);
const Direccion = require('./Direccion')(sequelize);
const HistorialCompra = require('./HistorialCompra')(sequelize);
const FrecuenciaCompra = require('./FrecuenciaCompra')(sequelize);

// Relaciones
Cliente.hasMany(Direccion, { foreignKey: 'cliente_id', as: 'direcciones' });
Direccion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Cliente.hasMany(HistorialCompra, { foreignKey: 'cliente_id', as: 'historial_compras' });
HistorialCompra.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Cliente.hasMany(FrecuenciaCompra, { foreignKey: 'cliente_id', as: 'frecuencia_compras' });
FrecuenciaCompra.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

module.exports = {
  sequelize, // ← Asegúrate de exportar sequelize
  Cliente,
  Direccion,
  HistorialCompra,
  FrecuenciaCompra
};