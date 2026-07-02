-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2026 a las 00:36:50
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `venta_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` bigint(20) NOT NULL,
  `tipo_documento` enum('DNI','RUC','CE','PASAPORTE') NOT NULL DEFAULT 'DNI',
  `numero_documento` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `razon_social` varchar(200) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('M','F','OTRO') DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `razon_social`, `email`, `telefono`, `direccion`, `fecha_nacimiento`, `genero`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'DNI', '12345678', 'Juan Carlos', 'Pérez Gómez', NULL, 'juan.perez@email.com', '999-111-111', 'Av. Principal 456, Lima', NULL, NULL, 1, '2026-06-29 00:12:48', '2026-06-29 00:12:48'),
(2, 'DNI', '87654321', 'María Elena', 'Rodríguez Torres', NULL, 'maria.rodriguez@email.com', '999-222-222', 'Calle Secundaria 789, Lima', NULL, NULL, 1, '2026-06-29 00:12:48', '2026-06-29 00:12:48'),
(3, 'RUC', '20123456789', 'Empresa', 'Farmacias del Perú S.A.', NULL, 'ventas@farmaciasperu.com', '999-333-333', 'Av. Empresarial 1000, Lima', NULL, NULL, 1, '2026-06-29 00:12:48', '2026-06-29 00:12:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodos_pago`
--

CREATE TABLE `metodos_pago` (
  `id` bigint(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `metodos_pago`
--

INSERT INTO `metodos_pago` (`id`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'Efectivo', 'Pago en efectivo', 1),
(2, 'Tarjeta Débito', 'Pago con tarjeta de débito', 1),
(3, 'Tarjeta Crédito', 'Pago con tarjeta de crédito', 1),
(4, 'Yape', 'Pago con Yape', 1),
(5, 'Plin', 'Pago con Plin', 1),
(6, 'Transferencia', 'Transferencia bancaria', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` bigint(20) NOT NULL,
  `numero_venta` varchar(20) NOT NULL,
  `sucursal_id` bigint(20) NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  `usuario_id` bigint(20) NOT NULL COMMENT 'ID del vendedor (referencia a auth_db)',
  `cliente_id` bigint(20) DEFAULT NULL,
  `metodo_pago_id` bigint(20) NOT NULL,
  `fecha_venta` datetime NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `igv` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `monto_recibido` decimal(10,2) DEFAULT NULL,
  `monto_cambio` decimal(10,2) DEFAULT NULL,
  `estado` enum('completada','cancelada','anulada','pendiente') DEFAULT 'completada',
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id`, `numero_venta`, `sucursal_id`, `usuario_id`, `cliente_id`, `metodo_pago_id`, `fecha_venta`, `subtotal`, `igv`, `total`, `descuento`, `monto_recibido`, `monto_cambio`, `estado`, `observaciones`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'VEN-20260702-000001', 1, 1, NULL, 1, '2026-07-02 22:04:24', 10.50, 1.89, 12.39, 0.00, NULL, NULL, 'completada', NULL, '2026-07-02 22:04:24', '2026-07-02 22:04:24'),
(2, 'VEN-20260702-000002', 1, 1, 3, 1, '2026-07-02 22:05:08', 12.00, 2.16, 14.16, 0.00, 50.00, 35.84, 'completada', '', '2026-07-02 22:05:08', '2026-07-02 22:05:08'),
(3, 'VEN-20260702-000003', 1, 1, 3, 5, '2026-07-02 22:06:56', 174.00, 31.32, 205.32, 0.00, 250.00, 44.68, 'completada', '', '2026-07-02 22:06:56', '2026-07-02 22:06:56'),
(4, 'VEN-20260702-000004', 1, 1, 3, 1, '2026-07-02 22:16:42', 6.00, 1.08, 7.08, 0.00, 10.00, 2.92, 'completada', '', '2026-07-02 22:16:42', '2026-07-02 22:16:42'),
(5, 'VEN-20260702-000005', 1, 1, 3, 1, '2026-07-02 22:34:45', 110.00, 19.80, 129.80, 0.00, 120.00, -9.80, 'completada', '', '2026-07-02 22:34:45', '2026-07-02 22:34:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta_detalles`
--

CREATE TABLE `venta_detalles` (
  `id` bigint(20) NOT NULL,
  `venta_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL COMMENT 'ID del producto (referencia a inventario_db)',
  `inventario_id` bigint(20) NOT NULL COMMENT 'ID del inventario específico (lote)',
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `lote` varchar(50) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `venta_detalles`
--

INSERT INTO `venta_detalles` (`id`, `venta_id`, `producto_id`, `inventario_id`, `cantidad`, `precio_unitario`, `descuento`, `subtotal`, `total`, `lote`, `fecha_vencimiento`, `fecha_creacion`) VALUES
(1, 1, 1, 1, 1, 10.50, 0.00, 10.50, 10.50, 'L-2024-001', '2027-12-31', '2026-07-02 22:04:24'),
(2, 2, 5, 7, 2, 6.00, 0.00, 12.00, 12.00, 'L-2024-005', '2027-06-30', '2026-07-02 22:05:08'),
(3, 3, 1, 1, 12, 8.50, 0.00, 102.00, 102.00, 'L-2024-001', '2027-12-31', '2026-07-02 22:06:56'),
(4, 3, 5, 7, 12, 6.00, 0.00, 72.00, 72.00, 'L-2024-005', '2027-06-30', '2026-07-02 22:06:56'),
(5, 4, 5, 7, 1, 6.00, 0.00, 6.00, 6.00, 'L-2024-005', '2027-06-30', '2026-07-02 22:16:43'),
(6, 5, 3, 5, 5, 22.00, 0.00, 110.00, 110.00, 'L-2024-003', '2027-01-31', '2026-07-02 22:34:45');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`);

--
-- Indices de la tabla `metodos_pago`
--
ALTER TABLE `metodos_pago`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_venta` (`numero_venta`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `metodo_pago_id` (`metodo_pago_id`);

--
-- Indices de la tabla `venta_detalles`
--
ALTER TABLE `venta_detalles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `venta_id` (`venta_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `metodos_pago`
--
ALTER TABLE `metodos_pago`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `venta_detalles`
--
ALTER TABLE `venta_detalles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago` (`id`);

--
-- Filtros para la tabla `venta_detalles`
--
ALTER TABLE `venta_detalles`
  ADD CONSTRAINT `venta_detalles_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
