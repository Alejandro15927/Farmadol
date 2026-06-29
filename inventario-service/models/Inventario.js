const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inventario = sequelize.define('inventario', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    producto_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'productos',
        key: 'id'
      }
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID de sucursal (referencia a sucursal_db)'
    },
    lote: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    cantidad_reservada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    cantidad_disponible: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: false
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    estado: {
      type: DataTypes.ENUM('activo', 'agotado', 'vencido', 'bloqueado'),
      defaultValue: 'activo'
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
    tableName: 'inventario'
  });

  return Inventario;
};