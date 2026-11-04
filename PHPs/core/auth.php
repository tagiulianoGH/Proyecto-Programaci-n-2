<?php
declare(strict_types=1);

/**
 * Autenticacion por token opaco (Bearer).
 * En la base solo se guarda el SHA-256 del token.
 */

require_once __DIR__ . '/permisos.php';

const SESION_DURACION_HORAS = 8;

function tokenPortador(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if ($header === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $nombre => $valor) {
            if (strcasecmp($nombre, 'Authorization') === 0) {
                $header = $valor;
                break;
            }
        }
    }

    if (preg_match('/^Bearer\s+(.+)$/i', trim((string) $header), $coincidencias)) {
        return trim($coincidencias[1]);
    }

    return null;
}

function hashToken(string $token): string
{
    return hash('sha256', $token);
}

/**
 * Devuelve el usuario autenticado o null.
 * Valida sesion vigente, no revocada y usuario activo.
 */
function usuarioDesdeToken(mysqli $conn, ?string $token): ?array
{
    if ($token === null || $token === '') {
        return null;
    }

    $sql = "
        SELECT u.id, u.nombre, u.apellido, u.email, u.idSucursal,
               r.nombre AS rol, suc.nombre AS sucursal,
               s.id AS idSesion, s.expiraEn
        FROM sesion s
        INNER JOIN usuario u ON u.id = s.idUsuario
        INNER JOIN rol r ON r.id = u.rol_id
        LEFT JOIN sucursal suc ON suc.id = u.idSucursal
        WHERE s.id = ?
          AND s.revocada = 0
          AND s.expiraEn > NOW()
          AND u.activo = 1
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $hash = hashToken($token);
    $stmt->bind_param('s', $hash);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stmt->close();

    if (!$fila) {
        return null;
    }

    $fila['id'] = (int) $fila['id'];
    $fila['idSucursal'] = $fila['idSucursal'] !== null ? (int) $fila['idSucursal'] : null;
    $fila['permisos'] = permisosDeRol($fila['rol']);

    return $fila;
}

function requireAuth(mysqli $conn): array
{
    $usuario = usuarioDesdeToken($conn, tokenPortador());

    if ($usuario === null) {
        responderError('Sesion no valida o expirada.', 401);
    }

    return $usuario;
}

function requirePermiso(mysqli $conn, string $permiso): array
{
    $usuario = requireAuth($conn);

    if (!tienePermiso($usuario, $permiso)) {
        responderError('No tenes permiso para realizar esta accion.', 403);
    }

    return $usuario;
}

function requireRol(mysqli $conn, array $roles): array
{
    $usuario = requireAuth($conn);

    if (!in_array($usuario['rol'], $roles, true)) {
        responderError('No tenes permiso para realizar esta accion.', 403);
    }

    return $usuario;
}

/**
 * Datos del usuario que se envian al cliente (sin hash ni datos internos).
 */
function usuarioPublico(array $usuario): array
{
    return [
        'id' => (int) $usuario['id'],
        'nombre' => $usuario['nombre'],
        'apellido' => $usuario['apellido'],
        'email' => $usuario['email'],
        'rol' => $usuario['rol'],
        'idSucursal' => $usuario['idSucursal'] !== null ? (int) $usuario['idSucursal'] : null,
        'sucursal' => $usuario['sucursal'] ?? null,
        'permisos' => $usuario['permisos'] ?? permisosDeRol($usuario['rol']),
        'debeCambiarPassword' => (int) ($usuario['debeCambiarPassword'] ?? 0) === 1,
    ];
}

/**
 * Un empleado solo puede operar sobre su sucursal asignada.
 */
function idSucursalRestringida(array $usuario): ?int
{
    if (($usuario['rol'] ?? null) === 'empleado') {
        return $usuario['idSucursal'] ?? null;
    }

    return null;
}
