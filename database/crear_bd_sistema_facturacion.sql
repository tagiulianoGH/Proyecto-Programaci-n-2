-- ============================================================================
--  crear_bd_sistema_facturacion.sql
-- ----------------------------------------------------------------------------
--  Crea la base de datos `sistema_facturacion` en XAMPP y la rellena con datos
--  de prueba generados aleatoriamente:
--
--    * 10 sucursales
--    * 20 clientes
--    * 10 items
--    * 10 facturas por CADA DIA del año (365 dias en 2026 => 3650 facturas)
--    * 1 a 3 items de detalle por factura
--
--  Requisitos:
--    - XAMPP con MySQL/MariaDB iniciado en el puerto 3306.
--    - MariaDB 10.2 o superior (se usan CTE recursivos).
--
--  IMPORTANTE:
--    El script es IDEMPOTENTE: si las tablas ya existen, las elimina y las
--    vuelve a crear. Si ademas quieres borrar la base completa (vistas,
--    procedimientos, etc.), descomenta la linea "DROP DATABASE" de abajo.
--
--  Como ejecutarlo:
--    Opcion A (recomendada): doble clic en crear_bd.bat
--    Opcion B: C:\xampp\mysql\bin\mysql.exe -u root < crear_bd_sistema_facturacion.sql
--    Opcion C: importarlo desde phpMyAdmin.
-- ============================================================================

SET NAMES utf8mb4;

-- DROP DATABASE IF EXISTS `sistema_facturacion`;   -- << descomentar solo si se quiere una base 100% limpia

CREATE DATABASE IF NOT EXISTS `sistema_facturacion`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `sistema_facturacion`;

-- ============================================================================
-- 1) ESTRUCTURA (identica a la base original)
-- ============================================================================

SET @OLD_FK_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `facturaitem`;
DROP TABLE IF EXISTS `factura`;
DROP TABLE IF EXISTS `item`;
DROP TABLE IF EXISTS `cliente`;
DROP TABLE IF EXISTS `sucursal`;

CREATE TABLE `sucursal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `ciudad` varchar(50) NOT NULL,
  `direccion` varchar(80) NOT NULL,
  `cantEmpleados` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `cliente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `situacionFiscal` enum('Responsable Inscripto','Monotributista','Exento','Consumidor final','No categorizado') DEFAULT NULL,
  `dni` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `item` (
  `idItem` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`idItem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `factura` (
  `nroFactura` int(11) NOT NULL AUTO_INCREMENT,
  `fechaFactura` date NOT NULL,
  `idCliente` int(11) NOT NULL,
  `idSucursal` int(11) NOT NULL,
  `importe` decimal(10,2) NOT NULL,
  `iva` decimal(10,2) NOT NULL,
  `estado` enum('Pendiente','Activo','Atrasado') DEFAULT NULL,
  PRIMARY KEY (`nroFactura`),
  KEY `fk_factura_sucursal` (`idSucursal`),
  CONSTRAINT `fk_factura_sucursal` FOREIGN KEY (`idSucursal`) REFERENCES `sucursal` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `facturaitem` (
  `nroFactura` int(11) NOT NULL,
  `idItem` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  PRIMARY KEY (`nroFactura`,`idItem`),
  KEY `fk_factura_item_item` (`idItem`),
  CONSTRAINT `fk_factura_item_factura` FOREIGN KEY (`nroFactura`) REFERENCES `factura` (`nroFactura`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_factura_item_item` FOREIGN KEY (`idItem`) REFERENCES `item` (`idItem`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = @OLD_FK_CHECKS;

-- ============================================================================
-- 2) PARAMETROS DEL GENERADOR
--    Cambia estos valores si quieres otra cantidad de datos.
-- ============================================================================

SET @anio           = 2026;   -- año a generar
SET @facturasPorDia = 10;     -- facturas por cada dia del año
SET @cantClientes   = 20;     -- debe coincidir con los clientes insertados
SET @cantSucursales = 10;     -- debe coincidir con las sucursales insertadas
SET @cantItems      = 10;     -- debe coincidir con los items insertados
SET @importeMinimo  = 1000.00;
SET @importeMaximo  = 50000.00;
SET @alicuotaIva    = 0.21;

-- Cantidad de dias del año elegido (365 en 2026, 366 en un año bisiesto)
SET @diasDelAnio = DATEDIFF(MAKEDATE(@anio + 1, 1), MAKEDATE(@anio, 1));

-- ============================================================================
-- 3) SUCURSALES (datos fijos y realistas)
-- ============================================================================

INSERT INTO `sucursal` (`nombre`, `ciudad`, `direccion`, `cantEmpleados`) VALUES
  ('Sucursal Centro',      'Santa Fe',      'Diagonal Martinez 676',  67),
  ('Sucursal Norte',       'Rafaela',       'Suipacha 1234',          12),
  ('Sucursal Sur',         'Santo Tomé',    'Avenida Spreen 1989',    89),
  ('Sucursal Este',        'Paraná',        'Buenos Aires 1372',      62),
  ('Sucursal Oeste',       'San Jorge',     'Ñandubay 1357',         189),
  ('Sucursal Costanera',   'Rosario',       'Oroño 845',              74),
  ('Sucursal Industrial',  'Córdoba',       'Av. Circunvalación 220', 130),
  ('Sucursal Aeropuerto',  'Ezeiza',        'Ruta 205 km 2',          45),
  ('Sucursal Microcentro', 'Buenos Aires',  'Florida 537',            98),
  ('Sucursal Universidad','La Plata',      'Calle 50 1150',          51);

-- ============================================================================
-- 4) CLIENTES (20 registros aleatorios)
-- ============================================================================

INSERT INTO `cliente` (`nombre`, `apellido`, `situacionFiscal`, `dni`)
WITH RECURSIVE seq (n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 20
)
SELECT
  ELT(1 + FLOOR(RAND() * 10),
      'Juan', 'María', 'Carlos', 'Ana', 'Roberto',
      'Laura', 'Jorge', 'Silvia', 'Miguel', 'Elena'),
  ELT(1 + FLOOR(RAND() * 10),
      'Pérez', 'Gómez', 'López', 'Fernández', 'Martínez',
      'Rodríguez', 'Díaz', 'Romero', 'Torres', 'Sosa'),
  ELT(1 + FLOOR(RAND() * 5),
      'Responsable Inscripto', 'Monotributista', 'Exento',
      'Consumidor final', 'No categorizado'),
  -- DNI unico y dentro de un rango realista (20.000.000 - 43.000.000)
  FLOOR(20000000 + (n * 1100000) + (RAND() * 900000))
FROM seq;

-- ============================================================================
-- 5) ITEMS (10 productos de ejemplo)
-- ============================================================================

INSERT INTO `item` (`nombre`, `descripcion`) VALUES
  ('Laptop HP Pavilion',          'Laptop para uso personal y ofimática, 8GB RAM, 256GB SSD'),
  ('Mouse Logitech MX Master',    'Mouse inalámbrico ergonómico de alta precisión'),
  ('Teclado Mecánico Corsair',    'Teclado mecánico RGB con switches azules'),
  ('Monitor Samsung 24"',         'Monitor LED Full HD de 24 pulgadas, HDMI y VGA'),
  ('Impresora HP LaserJet',       'Impresora láser monocromática, velocidad 30 ppm'),
  ('Silla de Oficina Ergonómica', 'Silla reclinable con soporte lumbar y reposabrazos ajustables'),
  ('Audífonos Sony WH-1000XM4',   'Audífonos inalámbricos con cancelación de ruido activa'),
  ('USB Flash 32GB Kingston',     'Memoria USB 3.0 de alta velocidad, 32GB'),
  ('Cable HDMI 2m',               'Cable HDMI 2.0 de 2 metros, compatible 4K'),
  ('Funda para Laptop 15"',       'Funda protectora acolchada para laptops de 15 pulgadas');

-- ============================================================================
-- 6) FACTURAS: 10 por cada dia del año
--    Se generan los dias del año y se combinan con 10 "lineas" por dia.
-- ============================================================================

INSERT INTO `factura` (`fechaFactura`, `idCliente`, `idSucursal`, `importe`, `iva`, `estado`)
WITH RECURSIVE
  dias (d) AS (
    SELECT 0
    UNION ALL
    SELECT d + 1 FROM dias WHERE d + 1 < @diasDelAnio
  ),
  lineas (l) AS (
    SELECT 1
    UNION ALL
    SELECT l + 1 FROM lineas WHERE l + 1 <= @facturasPorDia
  )
SELECT
  base.fechaFactura,
  base.idCliente,
  base.idSucursal,
  base.importe,
  ROUND(base.importe * @alicuotaIva, 2) AS iva,
  base.estado
FROM (
  SELECT
    DATE_ADD(MAKEDATE(@anio, 1), INTERVAL d.d DAY)                        AS fechaFactura,
    1 + FLOOR(RAND() * @cantClientes)                                     AS idCliente,
    1 + FLOOR(RAND() * @cantSucursales)                                   AS idSucursal,
    ROUND(@importeMinimo + RAND() * (@importeMaximo - @importeMinimo), 2) AS importe,
    ELT(1 + FLOOR(RAND() * 3), 'Pendiente', 'Activo', 'Atrasado')         AS estado
  FROM dias d
  CROSS JOIN lineas l
) AS base
ORDER BY base.fechaFactura;

-- ============================================================================
-- 7) DETALLE DE FACTURAS (1 a 3 items por factura)
--    El item se elige de forma ciclica para evitar duplicar la clave primaria
--    (nroFactura, idItem) y la cantidad es aleatoria.
-- ============================================================================

INSERT INTO `facturaitem` (`nroFactura`, `idItem`, `cantidad`)
SELECT
  f.nroFactura,
  1 + ((f.nroFactura + (l.l - 1) * 3) % @cantItems) AS idItem,
  1 + FLOOR(RAND() * 10)                            AS cantidad
FROM factura f
CROSS JOIN (
  SELECT 1 AS l
  UNION ALL SELECT 2
  UNION ALL SELECT 3
) l
WHERE l.l <= 1 + (f.nroFactura % 3)
ORDER BY f.nroFactura, l.l;

-- ============================================================================
-- 8) RESUMEN DE LA CARGA
-- ============================================================================

SELECT 'sucursales'  AS tabla, COUNT(*) AS filas FROM `sucursal`
UNION ALL SELECT 'clientes',   COUNT(*) FROM `cliente`
UNION ALL SELECT 'items',      COUNT(*) FROM `item`
UNION ALL SELECT 'facturas',   COUNT(*) FROM `factura`
UNION ALL SELECT 'facturaitem',COUNT(*) FROM `facturaitem`;

SELECT
  COUNT(*) AS dias_controlados,
  SUM(CASE WHEN cantidad = @facturasPorDia THEN 1 ELSE 0 END) AS dias_correctos,
  SUM(CASE WHEN cantidad <> @facturasPorDia THEN 1 ELSE 0 END) AS dias_incorrectos
FROM (
  SELECT DATE(`fechaFactura`) AS dia, COUNT(*) AS cantidad
  FROM `factura`
  GROUP BY DATE(`fechaFactura`)
) AS control;

SELECT
  MIN(`fechaFactura`) AS primera_fecha,
  MAX(`fechaFactura`) AS ultima_fecha,
  COUNT(DISTINCT DATE(`fechaFactura`)) AS dias_distintos
FROM `factura`;
