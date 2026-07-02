-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2026 a las 00:36:20
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
-- Base de datos: `cliente_db`
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
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `telefono_alternativo` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('M','F','OTRO') DEFAULT NULL,
  `estado_civil` enum('soltero','casado','divorciado','viudo') DEFAULT NULL,
  `ocupacion` varchar(100) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `ultima_compra` datetime DEFAULT NULL,
  `total_compras` int(11) DEFAULT 0,
  `total_gastado` decimal(10,2) DEFAULT 0.00,
  `promedio_gasto` decimal(10,2) DEFAULT 0.00,
  `puntos` int(11) DEFAULT 0,
  `nivel` enum('bronce','plata','oro','platino','diamante') DEFAULT 'bronce',
  `estado` tinyint(1) DEFAULT 1,
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `razon_social`, `email`, `telefono`, `telefono_alternativo`, `fecha_nacimiento`, `genero`, `estado_civil`, `ocupacion`, `fecha_registro`, `ultima_compra`, `total_compras`, `total_gastado`, `promedio_gasto`, `puntos`, `nivel`, `estado`, `observaciones`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'DNI', '12345678', 'Juan Carlos', 'Pérez Gómez', NULL, 'juan.perez@email.com', '999-111-111', NULL, NULL, NULL, NULL, NULL, '2026-06-29 03:47:15', NULL, 5, 450.00, 0.00, 0, 'plata', 1, NULL, '2026-06-29 03:47:15', '2026-06-29 03:47:15'),
(2, 'DNI', '87654321', 'María Elena', 'Rodríguez Torres', '', 'maria.rodriguez@email.com', '999-222-222', '', NULL, NULL, NULL, '', '2026-06-29 03:47:15', NULL, 12, 1250.00, 0.00, 0, 'oro', 1, '', '2026-06-29 03:47:15', '2026-06-30 02:46:10'),
(3, 'RUC', '201234567892', 'Empresa', 'Farmacias del Perú S.A.', '', 'ventas@farmaciasperu.com', '999-333-333', '', '0000-00-00', '', '', '', '2026-06-29 03:47:15', NULL, 25, 3500.00, 0.00, 0, 'platino', 1, '', '2026-06-29 03:47:15', '2026-06-30 00:31:12'),
(4, 'DNI', '45678912', 'Carlos', 'García López', '', 'carlos.garcia@email.com', '999-444-444', '', NULL, NULL, NULL, '', '2026-06-29 03:47:15', NULL, 3, 180.00, 0.00, 0, 'bronce', 1, '', '2026-06-29 03:47:15', '2026-06-30 02:45:59'),
(5, 'DNI', '78912345', 'Ana', 'Martínez Sánchez', '', 'ana.martinez@email.com', '999-555-555', '', NULL, NULL, NULL, '', '2026-06-29 03:47:15', NULL, 18, 2800.00, 0.00, 0, 'oro', 1, '', '2026-06-29 03:47:15', '2026-06-30 03:18:08'),
(6, 'DNI', '14785236', 'Alejandro', 'Paredes Eguia', '', 'juval40@hotmail.com', '959260629', '', '0000-00-00', '', '', '', '2026-06-29 23:31:07', NULL, 0, 0.00, 0.00, 0, 'bronce', 1, '', '2026-06-29 23:31:07', '2026-06-29 23:32:12'),
(7, 'DNI', '147852363', 'BARRIENTOS', 'Acosta Poma', '', 'juval420@hotmail.com', '9592630629', '', NULL, NULL, NULL, '', '2026-07-02 19:09:57', NULL, 0, 0.00, 0.00, 0, 'bronce', 1, '', '2026-07-02 19:09:57', '2026-07-02 19:09:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direcciones`
--

CREATE TABLE `direcciones` (
  `id` bigint(20) NOT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `tipo` enum('casa','trabajo','otro') DEFAULT 'casa',
  `direccion` text NOT NULL,
  `referencia` text DEFAULT NULL,
  `distrito` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `codigo_postal` varchar(10) DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT 0,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `direcciones`
--

INSERT INTO `direcciones` (`id`, `cliente_id`, `tipo`, `direccion`, `referencia`, `distrito`, `ciudad`, `departamento`, `codigo_postal`, `es_principal`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 1, 'casa', 'Av. Principal 456', 'Frente al parque', 'Miraflores', 'Lima', 'Lima', NULL, 1, 1, '2026-06-29 03:47:15', '2026-06-29 03:47:15'),
(2, 1, 'trabajo', 'Calle Comercio 123', 'Oficina 301', 'San Isidro', 'Lima', 'Lima', NULL, 0, 1, '2026-06-29 03:47:15', '2026-06-29 03:47:15'),
(3, 2, 'casa', 'Calle Secundaria 789', 'Altura del mercado', 'San Borja', 'Lima', 'Lima', NULL, 1, 1, '2026-06-29 03:47:15', '2026-06-29 03:47:15'),
(4, 3, 'casa', 'Av. Empresarial 1000', 'Torre A', 'Surco', 'Lima', 'Lima', NULL, 1, 1, '2026-06-29 03:47:15', '2026-06-29 03:47:15'),
(5, 4, 'casa', 'Calle Nueva 123', 'Cerca al colegio', 'Los Olivos', 'Lima', 'Lima', NULL, 1, 1, '2026-06-29 03:47:15', '2026-06-29 03:47:15'),
(8, 5, 'casa', 'Av. Primavera 456', 'Edificio 3', 'San Miguel', 'Lima', 'Lima', NULL, 1, 1, '2026-06-29 23:32:18', '2026-06-29 23:32:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `frecuencia_compras`
--

CREATE TABLE `frecuencia_compras` (
  `id` bigint(20) NOT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL COMMENT 'ID del producto (referencia a inventario_db)',
  `total_compras` int(11) DEFAULT 0,
  `total_unidades` int(11) DEFAULT 0,
  `total_gastado` decimal(10,2) DEFAULT 0.00,
  `ultima_compra` datetime DEFAULT NULL,
  `frecuencia` enum('baja','media','alta','muy_alta') DEFAULT 'baja',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_compras`
--

CREATE TABLE `historial_compras` (
  `id` bigint(20) NOT NULL,
  `cliente_id` bigint(20) NOT NULL,
  `venta_id` bigint(20) NOT NULL COMMENT 'ID de la venta (referencia a venta_db)',
  `sucursal_id` bigint(20) NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  `fecha_compra` datetime NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `productos` int(11) NOT NULL COMMENT 'Cantidad de productos diferentes',
  `unidades` int(11) NOT NULL COMMENT 'Total de unidades compradas',
  `metodo_pago` varchar(50) DEFAULT NULL,
  `estado` enum('completada','anulada','pendiente') DEFAULT 'completada',
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Indices de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indices de la tabla `frecuencia_compras`
--
ALTER TABLE `frecuencia_compras`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cliente_producto` (`cliente_id`,`producto_id`);

--
-- Indices de la tabla `historial_compras`
--
ALTER TABLE `historial_compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `frecuencia_compras`
--
ALTER TABLE `frecuencia_compras`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historial_compras`
--
ALTER TABLE `historial_compras`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD CONSTRAINT `direcciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `frecuencia_compras`
--
ALTER TABLE `frecuencia_compras`
  ADD CONSTRAINT `frecuencia_compras_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `historial_compras`
--
ALTER TABLE `historial_compras`
  ADD CONSTRAINT `historial_compras_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
