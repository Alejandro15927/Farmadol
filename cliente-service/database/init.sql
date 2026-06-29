CREATE DATABASE IF NOT EXISTS cliente_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cliente_db;

CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('DNI', 'RUC', 'CE', 'PASAPORTE') NOT NULL DEFAULT 'DNI',
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  razon_social VARCHAR(200),
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  telefono_alternativo VARCHAR(20),
  fecha_nacimiento DATE,
  genero ENUM('M', 'F', 'OTRO'),
  estado_civil ENUM('soltero', 'casado', 'divorciado', 'viudo'),
  ocupacion VARCHAR(100),
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultima_compra DATETIME,
  total_compras INT DEFAULT 0,
  total_gastado DECIMAL(10,2) DEFAULT 0,
  promedio_gasto DECIMAL(10,2) DEFAULT 0,
  puntos INT DEFAULT 0,
  nivel ENUM('bronce', 'plata', 'oro', 'platino', 'diamante') DEFAULT 'bronce',
  estado TINYINT(1) DEFAULT 1,
  observaciones TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS direcciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  tipo ENUM('casa', 'trabajo', 'otro') DEFAULT 'casa',
  direccion TEXT NOT NULL,
  referencia TEXT,
  distrito VARCHAR(100),
  ciudad VARCHAR(100),
  departamento VARCHAR(100),
  codigo_postal VARCHAR(10),
  es_principal TINYINT(1) DEFAULT 0,
  estado TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_compras (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  venta_id BIGINT NOT NULL COMMENT 'ID de la venta (referencia a venta_db)',
  sucursal_id BIGINT NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  fecha_compra DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  productos INT NOT NULL COMMENT 'Cantidad de productos diferentes',
  unidades INT NOT NULL COMMENT 'Total de unidades compradas',
  metodo_pago VARCHAR(50),
  estado ENUM('completada', 'anulada', 'pendiente') DEFAULT 'completada',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS frecuencia_compras (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL COMMENT 'ID del producto (referencia a inventario_db)',
  total_compras INT DEFAULT 0,
  total_unidades INT DEFAULT 0,
  total_gastado DECIMAL(10,2) DEFAULT 0,
  ultima_compra DATETIME,
  frecuencia ENUM('baja', 'media', 'alta', 'muy_alta') DEFAULT 'baja',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cliente_producto (cliente_id, producto_id)
);

-- Insertar clientes de ejemplo
INSERT INTO clientes (tipo_documento, numero_documento, nombres, apellidos, email, telefono, total_compras, total_gastado, nivel) VALUES
('DNI', '12345678', 'Juan Carlos', 'Pérez Gómez', 'juan.perez@email.com', '999-111-111', 5, 450.00, 'plata'),
('DNI', '87654321', 'María Elena', 'Rodríguez Torres', 'maria.rodriguez@email.com', '999-222-222', 12, 1250.00, 'oro'),
('RUC', '20123456789', 'Empresa', 'Farmacias del Perú S.A.', 'ventas@farmaciasperu.com', '999-333-333', 25, 3500.00, 'platino'),
('DNI', '45678912', 'Carlos', 'García López', 'carlos.garcia@email.com', '999-444-444', 3, 180.00, 'bronce'),
('DNI', '78912345', 'Ana', 'Martínez Sánchez', 'ana.martinez@email.com', '999-555-555', 18, 2800.00, 'oro');

-- Insertar direcciones de ejemplo
INSERT INTO direcciones (cliente_id, tipo, direccion, referencia, distrito, ciudad, departamento, es_principal) VALUES
(1, 'casa', 'Av. Principal 456', 'Frente al parque', 'Miraflores', 'Lima', 'Lima', 1),
(1, 'trabajo', 'Calle Comercio 123', 'Oficina 301', 'San Isidro', 'Lima', 'Lima', 0),
(2, 'casa', 'Calle Secundaria 789', 'Altura del mercado', 'San Borja', 'Lima', 'Lima', 1),
(3, 'casa', 'Av. Empresarial 1000', 'Torre A', 'Surco', 'Lima', 'Lima', 1),
(4, 'casa', 'Calle Nueva 123', 'Cerca al colegio', 'Los Olivos', 'Lima', 'Lima', 1),
(5, 'casa', 'Av. Primavera 456', 'Edificio 3', 'San Miguel', 'Lima', 'Lima', 1);