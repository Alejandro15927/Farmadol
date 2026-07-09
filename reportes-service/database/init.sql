-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2026 a las 00:36:41
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
-- Base de datos: `reporte_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alertas`
--

CREATE TABLE `alertas` (
  `id` bigint(20) NOT NULL,
  `tipo` enum('stock_bajo','producto_vencer','producto_vencido','venta_alta','venta_baja','cliente_frecuente','problema_inventario','sistema') NOT NULL,
  `nivel` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
  `titulo` varchar(200) NOT NULL,
  `mensaje` text NOT NULL,
  `datos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos`)),
  `sucursal_id` bigint(20) DEFAULT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  `usuario_id` bigint(20) DEFAULT NULL COMMENT 'ID del usuario que generó la alerta (referencia a auth_db)',
  `leida` tinyint(1) DEFAULT 0,
  `fecha_lectura` datetime DEFAULT NULL,
  `estado` enum('activa','resuelta','ignorada') DEFAULT 'activa',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_resolucion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` bigint(20) NOT NULL,
  `tipo` enum('ventas_diarias','ventas_mensuales','productos_mas_vendidos','stock_bajo','productos_vencer','rotacion_inventario','clientes_frecuentes','compras_proveedores','ventas_sucursal','ventas_vendedor','productos_menos_vendidos','margen_ganancia','resumen_general') NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `parametros` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parametros`)),
  `formato` enum('pdf','excel','csv','json') NOT NULL DEFAULT 'pdf',
  `ruta_archivo` varchar(500) DEFAULT NULL,
  `usuario_id` bigint(20) NOT NULL COMMENT 'ID del usuario que generó el reporte (referencia a auth_db)',
  `sucursal_id` bigint(20) DEFAULT NULL COMMENT 'ID de sucursal (referencia a sucursal_db)',
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `total_registros` int(11) DEFAULT 0,
  `tamanio_archivo` int(11) DEFAULT 0 COMMENT 'Tamaño en bytes',
  `estado` enum('generando','completado','fallido','cancelado') DEFAULT 'generando',
  `fecha_generacion` datetime DEFAULT current_timestamp(),
  `fecha_completado` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alertas`
--
ALTER TABLE `alertas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alertas`
--
ALTER TABLE `alertas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;