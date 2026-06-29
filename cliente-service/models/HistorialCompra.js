const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HistorialCompra = sequelize.define('historial_compras', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    venta_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de la venta (referencia a venta_db)'
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de sucursal (referencia a sucursal_db)'
    },
    fecha_compra: {
      type: DataTypes.DATE,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    productos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Cantidad de productos diferentes'
    },
    unidades: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Total de unidades compradas'
    },
    metodo_pago: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('completada', 'anulada', 'pendiente'),
      defaultValue: 'completada'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'historial_compras'
  });

  return HistorialCompra;
};