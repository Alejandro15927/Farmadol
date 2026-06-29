CREATE DATABASE IF NOT EXISTS venta_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE venta_db;

CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('DNI', 'RUC', 'CE', 'PASAPORTE') NOT NULL DEFAULT 'DNI',
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  razon_social VARCHAR(200),
  email VARCHAR(100),
  telefono VARCHAR(20),
  direccion TEXT,
  fecha_nacimiento DATE,
  genero ENUM('M', 'F', 'OTRO'),
  estado TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metodos_pago (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  estado TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  numero_venta VARCHAR(20) NOT NULL UNIQUE,
  sucursal_id BIGINT NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  usuario_id BIGINT NOT NULL COMMENT 'ID del vendedor (referencia a auth_db)',
  cliente_id BIGINT,
  metodo_pago_id BIGINT NOT NULL,
  fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  igv DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) DEFAULT 0,
  monto_recibido DECIMAL(10,2),
  monto_cambio DECIMAL(10,2),
  estado ENUM('completada', 'cancelada', 'anulada', 'pendiente') DEFAULT 'completada',
  observaciones TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id)
);

CREATE TABLE IF NOT EXISTS venta_detalles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  venta_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL COMMENT 'ID del producto (referencia a inventario_db)',
  inventario_id BIGINT NOT NULL COMMENT 'ID del inventario específico (lote)',
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  lote VARCHAR(50),
  fecha_vencimiento DATE,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- Insertar métodos de pago por defecto
INSERT INTO metodos_pago (nombre, descripcion) VALUES
('Efectivo', 'Pago en efectivo'),
('Tarjeta Débito', 'Pago con tarjeta de débito'),
('Tarjeta Crédito', 'Pago con tarjeta de crédito'),
('Yape', 'Pago con Yape'),
('Plin', 'Pago con Plin'),
('Transferencia', 'Transferencia bancaria');

-- Insertar clientes de ejemplo
INSERT INTO clientes (tipo_documento, numero_documento, nombres, apellidos, email, telefono, direccion) VALUES
('DNI', '12345678', 'Juan Carlos', 'Pérez Gómez', 'juan.perez@email.com', '999-111-111', 'Av. Principal 456, Lima'),
('DNI', '87654321', 'María Elena', 'Rodríguez Torres', 'maria.rodriguez@email.com', '999-222-222', 'Calle Secundaria 789, Lima'),
('RUC', '20123456789', 'Empresa', 'Farmacias del Perú S.A.', 'ventas@farmaciasperu.com', '999-333-333', 'Av. Empresarial 1000, Lima');