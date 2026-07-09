const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alerta = sequelize.define('alertas', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.ENUM('stock_bajo', 'producto_vencer', 'producto_vencido', 'venta_alta', 'venta_baja', 'cliente_frecuente', 'problema_inventario', 'sistema'),
      allowNull: false
    },
    nivel: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
      defaultValue: 'info'
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    datos: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID de sucursal (referencia a sucursal_db)'
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID del usuario que generó la alerta (referencia a auth_db)'
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_lectura: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('activa', 'resuelta', 'ignorada'),
      defaultValue: 'activa'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_resolucion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'alertas'
  });

  return Alerta;
};