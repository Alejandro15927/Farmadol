const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MovimientoInventario = sequelize.define('movimientos_inventario', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    inventario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'inventario',
        key: 'id'
      }
    },
    tipo_movimiento: {
      type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'transferencia_origen', 'transferencia_destino'),
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad_anterior: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad_nueva: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    referencia_tipo: {
      type: DataTypes.ENUM('compra', 'venta', 'transferencia', 'ajuste'),
      allowNull: false
    },
    referencia_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de la referencia (compra_id, venta_id, transferencia_id)'
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del usuario que realiza el movimiento (referencia a auth_db)'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_movimiento: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'movimientos_inventario'
  });

  return MovimientoInventario;
};