const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CompraDetalle = sequelize.define('compra_detalles', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    compra_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'compras',
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del producto (referencia a inventario_db)'
    },
    lote: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'compra_detalles'
  });

  return CompraDetalle;
};