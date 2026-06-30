-- sucursal-service/database/init.sql
CREATE DATABASE IF NOT EXISTS sucursal_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sucursal_db;

CREATE TABLE IF NOT EXISTS sucursales (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  direccion TEXT NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  horario_atencion VARCHAR(100),
  encargado VARCHAR(100),
  estado TINYINT(1) DEFAULT 1,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transferencias (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sucursal_origen_id BIGINT NOT NULL,
  sucursal_destino_id BIGINT NOT NULL,
  producto_id BIGINT NOT NULL COMMENT 'ID del producto en inventario_db',
  cantidad INT NOT NULL,
  lote VARCHAR(50),
  fecha_vencimiento DATE,
  estado ENUM('pendiente', 'en_proceso', 'completada', 'cancelada') DEFAULT 'pendiente',
  usuario_solicita BIGINT NOT NULL COMMENT 'ID del usuario que solicita',
  usuario_autoriza BIGINT NULL COMMENT 'ID del usuario que autoriza',
  fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_autorizacion DATETIME,
  fecha_completada DATETIME,
  observaciones TEXT,
  FOREIGN KEY (sucursal_origen_id) REFERENCES sucursales(id),
  FOREIGN KEY (sucursal_destino_id) REFERENCES sucursales(id)
);

-- Insertar sucursales de ejemplo
INSERT INTO sucursales (nombre, codigo, direccion, telefono, email, horario_atencion, encargado) VALUES
('Sucursal Central', 'SC-001', 'Av. Principal 123, Lima', '999-999-999', 'central@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'Juan Pérez'),
('Sucursal Norte', 'SC-002', 'Calle Norte 456, Lima', '888-888-888', 'norte@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'María García'),
('Sucursal Sur', 'SC-003', 'Av. Sur 789, Lima', '777-777-777', 'sur@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'Carlos López');