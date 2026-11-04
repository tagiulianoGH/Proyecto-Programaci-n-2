<?php
declare(strict_types=1);

/**
 * Arranque comun de todos los endpoints.
 * Incluye dependencias, configura CORS y corta los preflight OPTIONS.
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/permisos.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/auditoria.php';

aplicarCors();

/**
 * Devuelve el valor de configuracion o el default.
 */
function obtenerConfiguracion(mysqli $conn, string $clave, ?string $default = null): ?string
{
    $stmt = $conn->prepare('SELECT valor FROM configuracion WHERE clave = ? LIMIT 1');
    $stmt->bind_param('s', $clave);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $fila ? (string) $fila['valor'] : $default;
}
