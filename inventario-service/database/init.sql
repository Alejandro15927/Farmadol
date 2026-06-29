CREATE DATABASE IF NOT EXISTS inventario_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_db;

CREATE TABLE IF NOT EXISTS categorias (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  estado TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria_id BIGINT NOT NULL,
  precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
  requiere_receta TINYINT(1) DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 10,
  stock_maximo INT NOT NULL DEFAULT 500,
  unidad_medida ENUM('unidad', 'caja', 'frasco', 'ampolla', 'blister') DEFAULT 'unidad',
  estado TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS inventario (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT NOT NULL,
  sucursal_id BIGINT NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  lote VARCHAR(50) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  cantidad_reservada INT NOT NULL DEFAULT 0,
  cantidad_disponible INT NOT NULL DEFAULT 0,
  fecha_vencimiento DATE NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado ENUM('activo', 'agotado', 'vencido', 'bloqueado') DEFAULT 'activo',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inventario_id BIGINT NOT NULL,
  tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'transferencia_origen', 'transferencia_destino') NOT NULL,
  cantidad INT NOT NULL,
  cantidad_anterior INT NOT NULL,
  cantidad_nueva INT NOT NULL,
  referencia_tipo ENUM('compra', 'venta', 'transferencia', 'ajuste') NOT NULL,
  referencia_id BIGINT NOT NULL COMMENT 'ID de la referencia (compra_id, venta_id, transferencia_id)',
  usuario_id BIGINT NOT NULL COMMENT 'ID del usuario que realiza el movimiento',
  observaciones TEXT,
  fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventario_id) REFERENCES inventario(id)
);

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, descripcion) VALUES
('Analgésicos', 'Medicamentos para el dolor'),
('Antibióticos', 'Medicamentos para infecciones bacterianas'),
('Antiinflamatorios', 'Medicamentos para la inflamación'),
('Vitaminas', 'Suplementos vitamínicos'),
('Cuidado Personal', 'Productos de higiene y cuidado personal');

-- Insertar productos de ejemplo
INSERT INTO productos (codigo, nombre, descripcion, categoria_id, precio_compra, precio_venta, requiere_receta, stock_minimo, stock_maximo) VALUES
('MED-001', 'Paracetamol 500mg', 'Analgésico y antipirético', 1, 5.00, 8.50, 0, 50, 500),
('MED-002', 'Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 3, 8.00, 12.00, 0, 30, 300),
('MED-003', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro', 2, 15.00, 22.00, 1, 20, 200),
('MED-004', 'Vitamina C 1000mg', 'Suplemento vitamínico', 4, 10.00, 15.00, 0, 40, 400),
('MED-005', 'Jabón Antibacterial', 'Jabón líquido antibacterial', 5, 3.50, 6.00, 0, 20, 200);

-- Insertar inventario inicial (sucursal 1 y 2)
INSERT INTO inventario (producto_id, sucursal_id, lote, cantidad, cantidad_reservada, cantidad_disponible, fecha_vencimiento, costo_unitario) VALUES
(1, 1, 'L-2024-001', 100, 0, 100, '2025-12-31', 5.00),
(1, 2, 'L-2024-001', 80, 0, 80, '2025-12-31', 5.00),
(2, 1, 'L-2024-002', 60, 0, 60, '2025-11-30', 8.00),
(2, 2, 'L-2024-002', 40, 0, 40, '2025-11-30', 8.00),
(3, 1, 'L-2024-003', 30, 0, 30, '2026-01-31', 15.00),
(4, 1, 'L-2024-004', 80, 0, 80, '2025-10-31', 10.00),
(5, 1, 'L-2024-005', 50, 0, 50, '2026-06-30', 3.50);