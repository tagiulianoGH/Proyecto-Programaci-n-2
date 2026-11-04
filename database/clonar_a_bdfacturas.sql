-- ============================================================================
--  clonar_a_bdfacturas.sql
--  Copia TODAS las tablas y datos de sistema_facturacion a bdfacturas.
--  Ambas bases deben estar en el mismo servidor MySQL/MariaDB (XAMPP local).
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) Crear la base destino si no existe
CREATE DATABASE IF NOT EXISTS `bdfacturas`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

-- 2) Copiar cada tabla: estructura + datos
--    Orden respetando foreign keys.

-- sucursal (sin dependencias)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`sucursal` LIKE `sistema_facturacion`.`sucursal`;
INSERT INTO `bdfacturas`.`sucursal` SELECT * FROM `sistema_facturacion`.`sucursal`;

-- cliente (sin dependencias)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`cliente` LIKE `sistema_facturacion`.`cliente`;
INSERT INTO `bdfacturas`.`cliente` SELECT * FROM `sistema_facturacion`.`cliente`;

-- item (sin dependencias)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`item` LIKE `sistema_facturacion`.`item`;
INSERT INTO `bdfacturas`.`item` SELECT * FROM `sistema_facturacion`.`item`;

-- rol (sin dependencias)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`rol` LIKE `sistema_facturacion`.`rol`;
INSERT INTO `bdfacturas`.`rol` SELECT * FROM `sistema_facturacion`.`rol`;

-- factura (depende de sucursal)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`factura` LIKE `sistema_facturacion`.`factura`;
INSERT INTO `bdfacturas`.`factura` SELECT * FROM `sistema_facturacion`.`factura`;

-- usuario (depende de rol, sucursal, usuario)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`usuario` LIKE `sistema_facturacion`.`usuario`;
INSERT INTO `bdfacturas`.`usuario` SELECT * FROM `sistema_facturacion`.`usuario`;

-- facturaitem (depende de factura, item)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`facturaitem` LIKE `sistema_facturacion`.`facturaitem`;
INSERT INTO `bdfacturas`.`facturaitem` SELECT * FROM `sistema_facturacion`.`facturaitem`;

-- sesion (depende de usuario)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`sesion` LIKE `sistema_facturacion`.`sesion`;
INSERT INTO `bdfacturas`.`sesion` SELECT * FROM `sistema_facturacion`.`sesion`;

-- auditoria (depende de usuario)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`auditoria` LIKE `sistema_facturacion`.`auditoria`;
INSERT INTO `bdfacturas`.`auditoria` SELECT * FROM `sistema_facturacion`.`auditoria`;

-- intento_login (sin dependencias)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`intento_login` LIKE `sistema_facturacion`.`intento_login`;
INSERT INTO `bdfacturas`.`intento_login` SELECT * FROM `sistema_facturacion`.`intento_login`;

-- configuracion (sin dependencias)
CREATE TABLE IF NOT EXISTS `bdfacturas`.`configuracion` LIKE `sistema_facturacion`.`configuracion`;
INSERT INTO `bdfacturas`.`configuracion` SELECT * FROM `sistema_facturacion`.`configuracion`;

SET FOREIGN_KEY_CHECKS = 1;

-- 3) Resumen de filas copiadas
SELECT 'sucursal' AS tabla, COUNT(*) AS filas FROM `bdfacturas`.`sucursal`
UNION ALL SELECT 'cliente', COUNT(*) FROM `bdfacturas`.`cliente`
UNION ALL SELECT 'item', COUNT(*) FROM `bdfacturas`.`item`
UNION ALL SELECT 'rol', COUNT(*) FROM `bdfacturas`.`rol`
UNION ALL SELECT 'factura', COUNT(*) FROM `bdfacturas`.`factura`
UNION ALL SELECT 'usuario', COUNT(*) FROM `bdfacturas`.`usuario`
UNION ALL SELECT 'facturaitem', COUNT(*) FROM `bdfacturas`.`facturaitem`
UNION ALL SELECT 'sesion', COUNT(*) FROM `bdfacturas`.`sesion`
UNION ALL SELECT 'auditoria', COUNT(*) FROM `bdfacturas`.`auditoria`
UNION ALL SELECT 'intento_login', COUNT(*) FROM `bdfacturas`.`intento_login`
UNION ALL SELECT 'configuracion', COUNT(*) FROM `bdfacturas`.`configuracion`;

SELECT 'Clonacion completada: bdfacturas ahora tiene todo lo de sistema_facturacion.' AS mensaje;
