CREATE DATABASE IF NOT EXISTS reporte_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE reporte_db;

CREATE TABLE IF NOT EXISTS reportes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM(
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
  ) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  parametros JSON,
  formato ENUM('pdf', 'excel', 'csv', 'json') NOT NULL DEFAULT 'pdf',
  ruta_archivo VARCHAR(500),
  usuario_id BIGINT NOT NULL COMMENT 'ID del usuario que generó el reporte',
  sucursal_id BIGINT COMMENT 'ID de sucursal (referencia a sucursal_db)',
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  total_registros INT DEFAULT 0,
  tamanio_archivo INT DEFAULT 0 COMMENT 'Tamaño en bytes',
  estado ENUM('generando', 'completado', 'fallido', 'cancelado') DEFAULT 'generando',
  fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_completado DATETIME,
  observaciones TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alertas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM(
    'stock_bajo',
    'producto_vencer',
    'producto_vencido',
    'venta_alta',
    'venta_baja',
    'cliente_frecuente',
    'problema_inventario',
    'sistema'
  ) NOT NULL,
  nivel ENUM('info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'info',
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  datos JSON,
  sucursal_id BIGINT COMMENT 'ID de sucursal (referencia a sucursal_db)',
  usuario_id BIGINT COMMENT 'ID del usuario que generó la alerta',
  leida TINYINT(1) DEFAULT 0,
  fecha_lectura DATETIME,
  estado ENUM('activa', 'resuelta', 'ignorada') DEFAULT 'activa',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion DATETIME
);

-- Insertar alertas de ejemplo
INSERT INTO alertas (tipo, nivel, titulo, mensaje, datos, estado) VALUES
('sistema', 'info', 'Sistema Operativo', 'Reportes Service inicializado correctamente', '{"version": "1.0.0"}', 'resuelta'),
('stock_bajo', 'warning', 'Stock Bajo: Paracetamol', 'El producto Paracetamol 500mg tiene stock bajo en la sucursal Central', '{"producto": "Paracetamol 500mg", "stock": 5, "minimo": 10}', 'activa');