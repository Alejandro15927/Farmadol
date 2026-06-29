const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Compra = sequelize.define('compras', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    numero_factura: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    proveedor_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'proveedores',
        key: 'id'
      }
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de la sucursal destino (referencia a sucursal_db)'
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del usuario que registra la compra (referencia a auth_db)'
    },
    fecha_compra: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_factura: {
      type: DataTypes.DATE,
      allowNull: true
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
    tipo_pago: {
      type: DataTypes.ENUM('contado', 'credito'),
      allowNull: false,
      defaultValue: 'contado'
    },
    plazo_credito: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Días de crédito'
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'recibido', 'parcial', 'cancelado'),
      defaultValue: 'pendiente'
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
    tableName: 'compras'
  });

  return Compra;
};