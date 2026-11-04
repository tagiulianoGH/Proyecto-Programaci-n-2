-- ============================================================================
--  restaurar_contrasenas.sql
--  Vuelve a las contraseñas originales de los usuarios iniciales.
--  El script de migración usa ON DUPLICATE KEY UPDATE id = id, por lo que
--  simplemente volver a ejecutarlo NO actualiza contraseñas existentes.
--  Este script hace UPDATE explícito sobre cada usuario.
-- ============================================================================

USE `sistema_facturacion`;

-- dev@giulicorp.com       / Dev1234!        -> rol dev
UPDATE `usuario`
SET `password_hash` = '$2y$10$F9KEiO/FGGnpOCDWzD6Dr.ECN.78TN1KYODKAIixrGsy6qzQT705m',
    `debeCambiarPassword` = 0
WHERE `email` = 'dev@giulicorp.com';

-- admin@giulicorp.com     / Admin1234!      -> rol admin
UPDATE `usuario`
SET `password_hash` = '$2y$10$/nRwigkqcXV4YX.l4eFxC.c9gTK9eIdMpDMxNTwXTGT34X6xg6fhi',
    `debeCambiarPassword` = 0
WHERE `email` = 'admin@giulicorp.com';

-- empleado@giulicorp.com  / Empleado1234!   -> rol empleado (Sucursal Centro)
UPDATE `usuario`
SET `password_hash` = '$2y$10$bhTbR6AgwtFhyn5OrkBa8uPTE1aqJ.w977IZDl90akIoXyLzlVS9a',
    `debeCambiarPassword` = 0
WHERE `email` = 'empleado@giulicorp.com';

-- empleado2@giulicorp.com / Empleado1234!   -> rol empleado (Sucursal Norte)
UPDATE `usuario`
SET `password_hash` = '$2y$10$bhTbR6AgwtFhyn5OrkBa8uPTE1aqJ.w977IZDl90akIoXyLzlVS9a',
    `debeCambiarPassword` = 0
WHERE `email` = 'empleado2@giulicorp.com';

SELECT 'Contraseñas restauradas.' AS mensaje;
