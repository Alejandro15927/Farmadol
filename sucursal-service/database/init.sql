-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2026 a las 00:36:45
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
-- Base de datos: `sucursal_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sucursales`
--

CREATE TABLE `sucursales` (
  `id` bigint(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `direccion` text NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `horario_atencion` varchar(100) DEFAULT NULL,
  `encargado` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sucursales`
--

INSERT INTO `sucursales` (`id`, `nombre`, `codigo`, `direccion`, `telefono`, `email`, `horario_atencion`, `encargado`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'Sucursal Central', 'SC-001', 'Av. Principal 123, Lima', '999-999-999', 'central@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'Juan Pérez', 1, '2026-06-28 20:08:33', '2026-06-30 02:21:12'),
(2, 'Sucursal Norte', 'SC-002', 'Calle Norte 456, Lima', '888-888-888', 'norte@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'María García', 1, '2026-06-28 20:08:33', '2026-06-30 03:18:46'),
(3, 'Sucursal Sur', 'SC-003', 'Av. Sur 789, Lima', '777-777-777', 'sur@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'Carlos López', 1, '2026-06-28 20:08:33', '2026-06-30 03:18:53'),
(4, 'Sucursal Este', 'SC-004', 'Av. Este 321, Lima', '666-666-666', 'este@farmadol.com', 'Lun-Vie 8am-8pm, Sab 9am-6pm', 'Ana Martínez', 1, '2026-06-29 21:06:20', '2026-06-30 02:35:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transferencias`
--

CREATE TABLE `transferencias` (
  `id` bigint(20) NOT NULL,
  `sucursal_origen_id` bigint(20) NOT NULL,
  `sucursal_destino_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL COMMENT 'ID del producto en inventario_db',
  `cantidad` int(11) NOT NULL,
  `lote` varchar(50) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `estado` enum('pendiente','en_proceso','completada','cancelada') DEFAULT 'pendiente',
  `usuario_solicita` bigint(20) NOT NULL COMMENT 'ID del usuario que solicita',
  `usuario_autoriza` bigint(20) DEFAULT NULL COMMENT 'ID del usuario que autoriza',
  `fecha_solicitud` datetime DEFAULT current_timestamp(),
  `fecha_autorizacion` datetime DEFAULT NULL,
  `fecha_completada` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `sucursales`
--
ALTER TABLE `sucursales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `transferencias`
--
ALTER TABLE `transferencias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sucursal_origen_id` (`sucursal_origen_id`),
  ADD KEY `sucursal_destino_id` (`sucursal_destino_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `sucursales`
--
ALTER TABLE `sucursales`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `transferencias`
--
ALTER TABLE `transferencias`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `transferencias`
--
ALTER TABLE `transferencias`
  ADD CONSTRAINT `transferencias_ibfk_1` FOREIGN KEY (`sucursal_origen_id`) REFERENCES `sucursales` (`id`),
  ADD CONSTRAINT `transferencias_ibfk_2` FOREIGN KEY (`sucursal_destino_id`) REFERENCES `sucursales` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
