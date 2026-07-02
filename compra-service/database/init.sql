-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2026 a las 00:36:27
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
-- Base de datos: `compra_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras`
--

CREATE TABLE `compras` (
  `id` bigint(20) NOT NULL,
  `numero_factura` varchar(50) NOT NULL,
  `proveedor_id` bigint(20) NOT NULL,
  `sucursal_id` bigint(20) NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  `usuario_id` bigint(20) NOT NULL COMMENT 'ID de usuario (referencia a auth_db)',
  `fecha_compra` datetime DEFAULT current_timestamp(),
  `fecha_factura` datetime DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `igv` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tipo_pago` enum('contado','credito') NOT NULL DEFAULT 'contado',
  `plazo_credito` int(11) DEFAULT NULL COMMENT 'Días de crédito',
  `estado` enum('pendiente','recibido','parcial','cancelado') DEFAULT 'pendiente',
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compras`
--

INSERT INTO `compras` (`id`, `numero_factura`, `proveedor_id`, `sucursal_id`, `usuario_id`, `fecha_compra`, `fecha_factura`, `subtotal`, `igv`, `total`, `tipo_pago`, `plazo_credito`, `estado`, `observaciones`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'F001-111', 3, 1, 1, '2026-07-02 19:18:19', '2026-07-02 00:00:00', 100.00, 18.00, 118.00, 'contado', NULL, 'recibido', '', '2026-07-02 19:18:19', '2026-07-02 19:30:38'),
(2, 'F0001-1112', 2, 2, 1, '2026-07-02 19:34:03', '2026-07-02 00:00:00', 25.00, 4.50, 29.50, 'contado', 30, 'recibido', '', '2026-07-02 19:34:03', '2026-07-02 22:25:06'),
(3, 'F0001-11123', 3, 3, 1, '2026-07-02 22:26:42', '2026-07-03 00:00:00', 10.00, 1.80, 11.80, 'contado', 30, 'recibido', '', '2026-07-02 22:26:42', '2026-07-02 22:26:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compra_detalles`
--

CREATE TABLE `compra_detalles` (
  `id` bigint(20) NOT NULL,
  `compra_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL COMMENT 'ID de producto (referencia a inventario_db)',
  `lote` varchar(50) NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `cantidad` int(11) NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `compra_detalles`
--

INSERT INTO `compra_detalles` (`id`, `compra_id`, `producto_id`, `lote`, `fecha_vencimiento`, `cantidad`, `costo_unitario`, `subtotal`, `descuento`, `total`, `fecha_creacion`) VALUES
(1, 1, 3, 'L-2026-001', '2026-09-30', 10, 10.00, 100.00, 0.00, 100.00, '2026-07-02 19:18:19'),
(4, 2, 1, 'L-2026-001', '2026-12-31', 5, 5.00, 25.00, 0.00, 25.00, '2026-07-02 20:20:02'),
(5, 3, 2, 'L-2026-01', '2026-07-30', 2, 5.00, 10.00, 0.00, 10.00, '2026-07-02 22:26:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id` bigint(20) NOT NULL,
  `ruc` varchar(20) NOT NULL,
  `razon_social` varchar(200) NOT NULL,
  `nombre_comercial` varchar(200) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contacto_nombre` varchar(100) DEFAULT NULL,
  `contacto_telefono` varchar(20) DEFAULT NULL,
  `contacto_email` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `ruc`, `razon_social`, `nombre_comercial`, `direccion`, `telefono`, `email`, `contacto_nombre`, `contacto_telefono`, `contacto_email`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, '12345678901', 'Laboratorios Farmadol S.A.', 'Farmadol', 'Av. Industrial 500, Lima', '444-444-444', 'ventas@farmadol.com', 'Carlos Gómez', '444-444-445', '', 1, '2026-06-28 23:48:59', '2026-07-02 14:17:06'),
(2, '98765432109', 'Distribuidora Medica S.A.C.', 'DistriMedI', 'Calle Comercio 200, Lima', '555-555-555', 'info@distrimed.com', 'Ana López', '555-555-556', '', 1, '2026-06-28 23:48:59', '2026-07-02 19:30:51'),
(3, '12332112331', 'UTP', 'UTP', 'UTP', '123321', 'UTP@UTP.com', 'UTP', '213321', 'UTP@UTP.COM', 1, '2026-07-02 19:16:10', '2026-07-02 19:16:10');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_factura` (`numero_factura`),
  ADD KEY `proveedor_id` (`proveedor_id`);

--
-- Indices de la tabla `compra_detalles`
--
ALTER TABLE `compra_detalles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `compra_id` (`compra_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ruc` (`ruc`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `compras`
--
ALTER TABLE `compras`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `compra_detalles`
--
ALTER TABLE `compra_detalles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`);

--
-- Filtros para la tabla `compra_detalles`
--
ALTER TABLE `compra_detalles`
  ADD CONSTRAINT `compra_detalles_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
