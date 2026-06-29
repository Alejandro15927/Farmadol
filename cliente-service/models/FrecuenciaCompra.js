const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FrecuenciaCompra = sequelize.define('frecuencia_compras', {
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
    producto_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del producto (referencia a inventario_db)'
    },
    total_compras: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_unidades: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_gastado: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    ultima_compra: {
      type: DataTypes.DATE,
      allowNull: true
    },
    frecuencia: {
      type: DataTypes.ENUM('baja', 'media', 'alta', 'muy_alta'),
      defaultValue: 'baja'
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
    tableName: 'frecuencia_compras'
  });

  return FrecuenciaCompra;
};