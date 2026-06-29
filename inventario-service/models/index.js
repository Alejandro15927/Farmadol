const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  logging: false
});

const Categoria = require('./Categoria')(sequelize);
const Producto = require('./Producto')(sequelize);
const Inventario = require('./Inventario')(sequelize);
const MovimientoInventario = require('./MovimientoInventario')(sequelize);

// Relaciones
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

Producto.hasMany(Inventario, { foreignKey: 'producto_id', as: 'inventario' });
Inventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Inventario.hasMany(MovimientoInventario, { foreignKey: 'inventario_id', as: 'movimientos' });
MovimientoInventario.belongsTo(Inventario, { foreignKey: 'inventario_id', as: 'inventario' });

module.exports = {
  sequelize,
  Categoria,
  Producto,
  Inventario,
  MovimientoInventario
};