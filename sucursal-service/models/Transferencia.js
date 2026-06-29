const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transferencia = sequelize.define('transferencias', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    sucursal_origen_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'sucursales',
        key: 'id'
      }
    },
    sucursal_destino_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'sucursales',
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del producto en inventario_db'
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    lote: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'completada', 'cancelada'),
      defaultValue: 'pendiente'
    },
    usuario_solicita: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del usuario que solicita la transferencia'
    },
    usuario_autoriza: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID del usuario que autoriza la transferencia'
    },
    fecha_solicitud: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_autorizacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_completada: {
      type: DataTypes.DATE,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'transferencias'
  });

  return Transferencia;
};