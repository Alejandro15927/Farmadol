const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Sucursal = require('./Sucursal')(sequelize);
const Transferencia = require('./Transferencia')(sequelize);

// Relaciones
Sucursal.hasMany(Transferencia, { 
  foreignKey: 'sucursal_origen_id', 
  as: 'transferencias_origen' 
});
Transferencia.belongsTo(Sucursal, { 
  foreignKey: 'sucursal_origen_id', 
  as: 'origen' 
});

Sucursal.hasMany(Transferencia, { 
  foreignKey: 'sucursal_destino_id', 
  as: 'transferencias_destino' 
});
Transferencia.belongsTo(Sucursal, { 
  foreignKey: 'sucursal_destino_id', 
  as: 'destino' 
});

module.exports = {
  sequelize,
  Sucursal,
  Transferencia
};