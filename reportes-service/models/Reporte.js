const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reporte = sequelize.define('reportes', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.ENUM(
        'ventas_diarias',
        'ventas_mensuales',
        'productos_mas_vendidos',
        'stock_bajo',
        'productos_vencer',
        'rotacion_inventario',
        'clientes_frecuentes',
        'compras_proveedores',
        'ventas_sucursal',
        'ventas_vendedor',
        'productos_menos_vendidos',
        'margen_ganancia',
        'resumen_general'
      ),
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parametros: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Parámetros usados para generar el reporte'
    },
    formato: {
      type: DataTypes.ENUM('pdf', 'excel', 'csv', 'json'),
      allowNull: false,
      defaultValue: 'pdf'
    },
    ruta_archivo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Ruta donde se almacena el archivo'
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'ID del usuario que generó el reporte'
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID de sucursal (referencia a sucursal_db)'
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_registros: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tamanio_archivo: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tamaño en bytes'
    },
    estado: {
      type: DataTypes.ENUM('generando', 'completado', 'fallido', 'cancelado'),
      defaultValue: 'generando'
    },
    fecha_generacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_completado: {
      type: DataTypes.DATE,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'reportes'
  });

  return Reporte;
};