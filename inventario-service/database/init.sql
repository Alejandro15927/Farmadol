-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2026 a las 00:36:32
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
-- Base de datos: `inventario_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` bigint(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`, `estado`, `fecha_creacion`) VALUES
(1, 'Analgésicos', 'Medicamentos para el dolor', 1, '2026-06-29 00:05:51'),
(2, 'Antibióticos', 'Medicamentos para infecciones bacterianas', 1, '2026-06-29 00:05:51'),
(3, 'Antiinflamatorios', 'Medicamentos para la inflamación', 1, '2026-06-29 00:05:51'),
(4, 'Vitaminas', 'Suplementos vitamínicos', 1, '2026-06-29 00:05:51'),
(5, 'Cuidado Personal', 'Productos de higiene y cuidado personal', 1, '2026-06-29 00:05:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `sucursal_id` bigint(20) NOT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  `lote` varchar(50) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `cantidad_reservada` int(11) NOT NULL DEFAULT 0,
  `cantidad_disponible` int(11) NOT NULL DEFAULT 0,
  `fecha_vencimiento` date NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estado` enum('activo','agotado','vencido','bloqueado') DEFAULT 'activo',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id`, `producto_id`, `sucursal_id`, `lote`, `cantidad`, `cantidad_reservada`, `cantidad_disponible`, `fecha_vencimiento`, `costo_unitario`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 1, 1, 'L-2024-001', 100, 0, 100, '2027-12-31', 5.00, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:44:52'),
(2, 1, 2, 'L-2024-001', 80, 0, 80, '2027-12-31', 5.00, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:44:54'),
(3, 2, 1, 'L-2024-002', 60, 0, 60, '2027-11-30', 8.00, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:44:57'),
(4, 2, 2, 'L-2024-002', 40, 0, 40, '2027-11-30', 8.00, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:45:08'),
(5, 3, 1, 'L-2024-003', 15, 0, 15, '2027-01-31', 15.00, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:45:11'),
(6, 4, 1, 'L-2024-004', 80, 0, 80, '2027-10-31', 10.00, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:45:15'),
(7, 5, 1, 'L-2024-005', 50, 0, 50, '2027-06-30', 3.50, 'activo', '2026-06-29 00:05:51', '2026-07-02 16:45:18'),
(8, 3, 2, 'L-2024-003', 15, 0, 15, '2027-01-31', 0.00, 'activo', '2026-06-30 02:38:28', '2026-07-02 16:45:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id` bigint(20) NOT NULL,
  `inventario_id` bigint(20) NOT NULL,
  `tipo_movimiento` enum('entrada','salida','ajuste','transferencia_origen','transferencia_destino') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `cantidad_anterior` int(11) NOT NULL,
  `cantidad_nueva` int(11) NOT NULL,
  `referencia_tipo` enum('compra','venta','transferencia','ajuste') NOT NULL,
  `referencia_id` bigint(20) NOT NULL COMMENT 'ID de la referencia (compra_id, venta_id, transferencia_id)',
  `usuario_id` bigint(20) NOT NULL COMMENT 'ID del usuario que realiza el movimiento',
  `observaciones` text DEFAULT NULL,
  `fecha_movimiento` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id`, `inventario_id`, `tipo_movimiento`, `cantidad`, `cantidad_anterior`, `cantidad_nueva`, `referencia_tipo`, `referencia_id`, `usuario_id`, `observaciones`, `fecha_movimiento`) VALUES
(1, 5, 'transferencia_origen', 15, 30, 15, 'transferencia', 1782787108037, 1, 'Transferencia a sucursal 2 - Transferencia de Amoxicilina 500mg', '2026-06-30 02:38:28'),
(2, 8, 'transferencia_destino', 15, 0, 15, 'transferencia', 1782787108037, 1, 'Transferencia desde sucursal 1 - Transferencia de Amoxicilina 500mg', '2026-06-30 02:38:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` bigint(20) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria_id` bigint(20) NOT NULL,
  `precio_compra` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_venta` decimal(10,2) NOT NULL DEFAULT 0.00,
  `requiere_receta` tinyint(1) DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 10,
  `stock_maximo` int(11) NOT NULL DEFAULT 500,
  `unidad_medida` enum('unidad','caja','frasco','ampolla','blister') DEFAULT 'unidad',
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `codigo`, `nombre`, `descripcion`, `categoria_id`, `precio_compra`, `precio_venta`, `requiere_receta`, `stock_minimo`, `stock_maximo`, `unidad_medida`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'MED-001', 'Paracetamol 500mg', 'Analgésico y antipirético', 1, 5.00, 8.50, 0, 50, 500, 'unidad', 1, '2026-06-29 00:05:51', '2026-06-29 00:05:51'),
(2, 'MED-002', 'Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 3, 8.00, 12.00, 0, 30, 300, 'unidad', 1, '2026-06-29 00:05:51', '2026-06-29 00:05:51'),
(3, 'MED-003', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro', 2, 15.00, 22.00, 1, 20, 200, 'unidad', 1, '2026-06-29 00:05:51', '2026-06-29 23:38:29'),
(4, 'MED-004', 'Vitamina C 1000mg', 'Suplemento vitamínico', 4, 10.00, 15.00, 0, 40, 400, 'unidad', 1, '2026-06-29 00:05:51', '2026-06-29 00:05:51'),
(5, 'MED-005', 'Jabón Antibacterial', 'Jabón líquido antibacterial', 5, 3.50, 6.00, 0, 20, 200, 'unidad', 1, '2026-06-29 00:05:51', '2026-06-29 00:05:51');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `producto_id` (`producto_id`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventario_id` (`inventario_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`inventario_id`) REFERENCES `inventario` (`id`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
