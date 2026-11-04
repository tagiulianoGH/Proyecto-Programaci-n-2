-- ============================================================================
--  migracion_usuarios.sql
-- ----------------------------------------------------------------------------
--  Agrega el sistema de usuarios, sesiones, auditoria e intentos de login a la
--  base `sistema_facturacion` SIN borrar los datos existentes.
--
--  Requisitos:
--    - Haber ejecutado antes crear_bd_sistema_facturacion.sql.
--    - XAMPP con MySQL/MariaDB iniciado.
--
--  Como ejecutarlo:
--    C:\xampp\mysql\bin\mysql.exe -u root < migracion_usuarios.sql
--    (o importarlo desde phpMyAdmin)
--
--  El script es idempotente: se puede ejecutar varias veces sin duplicar datos
--  ni resetear las contrasenas que ya fueron cambiadas.
--
--  Usuarios iniciales (cambiar la contrasena al primer ingreso):
--    dev@giulicorp.com       / Dev1234!        -> rol dev
--    admin@giulicorp.com     / Admin1234!      -> rol admin
--    empleado@giulicorp.com  / Empleado1234!   -> rol empleado (Sucursal Centro)
--    empleado2@giulicorp.com / Empleado1234!   -> rol empleado (Sucursal Norte)
-- ============================================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `sistema_facturacion`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `sistema_facturacion`;

-- ============================================================================
-- 1) ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `rol` (
  `id` tinyint(4) NOT NULL,
  `nombre` varchar(20) NOT NULL,
  `descripcion` varchar(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rol_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `rol` (`id`, `nombre`, `descripcion`) VALUES
  (1, 'empleado', 'Consulta de datos de su propia sucursal'),
  (2, 'admin',    'Gestion comercial: clientes, sucursales, facturas y usuarios empleado'),
  (3, 'dev',      'Superusuario tecnico: roles, sesiones, auditoria y configuracion')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`);

-- ============================================================================
-- 2) USUARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol_id` tinyint(4) NOT NULL,
  `idSucursal` int(11) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `debeCambiarPassword` tinyint(1) NOT NULL DEFAULT 0,
  `ultimoLogin` datetime DEFAULT NULL,
  `creadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creadoPor` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  KEY `idx_usuario_rol` (`rol_id`),
  KEY `idx_usuario_sucursal` (`idSucursal`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`),
  CONSTRAINT `fk_usuario_sucursal` FOREIGN KEY (`idSucursal`) REFERENCES `sucursal` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario_creador` FOREIGN KEY (`creadoPor`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3) SESIONES (el token nunca se guarda en texto plano)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `sesion` (
  `id` char(64) NOT NULL,
  `idUsuario` int(11) NOT NULL,
  `expiraEn` datetime NOT NULL,
  `creadaEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) DEFAULT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `revocada` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_sesion_usuario` (`idUsuario`),
  KEY `idx_sesion_expira` (`expiraEn`),
  CONSTRAINT `fk_sesion_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 4) AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS `auditoria` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `idUsuario` int(11) DEFAULT NULL,
  `accion` varchar(60) NOT NULL,
  `entidad` varchar(40) DEFAULT NULL,
  `entidadId` int(11) DEFAULT NULL,
  `detalle` longtext DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `creadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_usuario` (`idUsuario`),
  KEY `idx_auditoria_accion` (`accion`),
  KEY `idx_auditoria_fecha` (`creadoEn`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 5) INTENTOS DE LOGIN (rate limiting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `intento_login` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(120) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `exito` tinyint(1) NOT NULL DEFAULT 0,
  `creadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_intento_email_fecha` (`email`, `creadoEn`),
  KEY `idx_intento_ip_fecha` (`ip`, `creadoEn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 6) CONFIGURACION TECNICA (solo dev)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `configuracion` (
  `clave` varchar(60) NOT NULL,
  `valor` varchar(255) NOT NULL,
  `actualizadoEn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `configuracion` (`clave`, `valor`) VALUES
  ('modoMantenimiento', '0'),
  ('mensajeMantenimiento', 'El sistema se encuentra en mantenimiento. Intente nuevamente mas tarde.'),
  ('nombreEmpresa', 'GiuliCorp')
ON DUPLICATE KEY UPDATE `clave` = VALUES(`clave`);

-- ============================================================================
-- 7) USUARIOS INICIALES
--    ON DUPLICATE KEY UPDATE id = id  => si el usuario ya existe no se toca.
-- ============================================================================

INSERT INTO `usuario`
  (`nombre`, `apellido`, `email`, `password_hash`, `rol_id`, `idSucursal`)
VALUES
  ('Dev', 'GiuliCorp', 'dev@giulicorp.com', '$2y$10$F9KEiO/FGGnpOCDWzD6Dr.ECN.78TN1KYODKAIixrGsy6qzQT705m', 3, NULL),
  ('Admin', 'GiuliCorp', 'admin@giulicorp.com', '$2y$10$/nRwigkqcXV4YX.l4eFxC.c9gTK9eIdMpDMxNTwXTGT34X6xg6fhi', 2, NULL),
  ('Empleado', 'Centro', 'empleado@giulicorp.com', '$2y$10$bhTbR6AgwtFhyn5OrkBa8uPTE1aqJ.w977IZDl90akIoXyLzlVS9a', 1, 1),
  ('Empleado', 'Norte', 'empleado2@giulicorp.com', '$2y$10$bhTbR6AgwtFhyn5OrkBa8uPTE1aqJ.w977IZDl90akIoXyLzlVS9a', 1, 2)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 8) RESUMEN
-- ============================================================================

SELECT r.`nombre` AS rol, COUNT(u.`id`) AS usuarios
FROM `rol` r
LEFT JOIN `usuario` u ON u.`rol_id` = r.`id`
GROUP BY r.`id`, r.`nombre`
ORDER BY r.`id`;
