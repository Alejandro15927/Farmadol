const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venta = sequelize.define('ventas', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    numero_venta: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de sucursal (referencia a sucursal_db)'
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del vendedor (referencia a auth_db)'
    },
    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID del cliente (referencia a cliente_db)'
    },
    metodo_pago_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'metodos_pago',
        key: 'id'
      }
    },
    fecha_venta: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    igv: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    monto_recibido: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    monto_cambio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('completada', 'cancelada', 'anulada', 'pendiente'),
      defaultValue: 'completada'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'ventas'
  });

  return Venta;
};