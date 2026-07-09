const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Producto = sequelize.define('productos', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Código SKU único del producto'
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoria_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'categorias',
        key: 'id'
      }
    },
    precio_compra: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    requiere_receta: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    stock_maximo: {
      type: DataTypes.INTEGER,
      defaultValue: 500
    },
    unidad_medida: {
      type: DataTypes.ENUM('unidad', 'caja', 'frasco', 'ampolla', 'blister'),
      defaultValue: 'unidad'
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'productos'
  });

  return Producto;
};