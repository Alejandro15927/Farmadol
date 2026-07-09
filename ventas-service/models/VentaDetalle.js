const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VentaDetalle = sequelize.define('venta_detalles', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    venta_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'ventas',
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del producto (referencia a inventario_db)'
    },
    inventario_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID del inventario específico (lote)'
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    lote: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'venta_detalles'
  });

  return VentaDetalle;
};