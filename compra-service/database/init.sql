CREATE DATABASE IF NOT EXISTS compra_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE compra_db;

CREATE TABLE IF NOT EXISTS proveedores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ruc VARCHAR(20) NOT NULL UNIQUE,
  razon_social VARCHAR(200) NOT NULL,
  nombre_comercial VARCHAR(200),
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(100),
  contacto_nombre VARCHAR(100),
  contacto_telefono VARCHAR(20),
  contacto_email VARCHAR(100),
  estado TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compras (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  numero_factura VARCHAR(50) NOT NULL UNIQUE,
  proveedor_id BIGINT NOT NULL,
  sucursal_id BIGINT NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  usuario_id BIGINT NOT NULL COMMENT 'ID de usuario (referencia a auth_db)',
  fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_factura DATETIME,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  igv DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  tipo_pago ENUM('contado', 'credito') NOT NULL DEFAULT 'contado',
  plazo_credito INT NULL COMMENT 'Días de crédito',
  estado ENUM('pendiente', 'recibido', 'parcial', 'cancelado') DEFAULT 'pendiente',
  observaciones TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

CREATE TABLE IF NOT EXISTS compra_detalles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  compra_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL COMMENT 'ID de producto (referencia a inventario_db)',
  lote VARCHAR(50) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
);

-- Insertar proveedores de ejemplo
INSERT INTO proveedores (ruc, razon_social, nombre_comercial, direccion, telefono, email, contacto_nombre, contacto_telefono) VALUES
('12345678901', 'Laboratorios Farmadol S.A.', 'Farmadol', 'Av. Industrial 500, Lima', '444-444-444', 'ventas@farmadol.com', 'Carlos Gómez', '444-444-445'),
('98765432109', 'Distribuidora Medica S.A.C.', 'DistriMed', 'Calle Comercio 200, Lima', '555-555-555', 'info@distrimed.com', 'Ana López', '555-555-556');