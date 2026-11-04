<?php
declare(strict_types=1);

/**
 * Utilidades de respuesta JSON y CORS.
 */

function aplicarCors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Permitir cualquier puerto local (Angular suele usar 4200/4300).
    if ($origin !== '' && preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } elseif ($origin === '') {
        header('Access-Control-Allow-Origin: http://localhost:4300');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json; charset=UTF-8');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

function responder(mixed $data, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function responderError(string $mensaje, int $codigo = 400, array $extra = []): never
{
    responder(array_merge([
        'error' => true,
        'message' => $mensaje,
    ], $extra), $codigo);
}

/**
 * Devuelve el cuerpo de la peticion como array.
 * Acepta JSON (application/json) o formulario tradicional.
 */
function leerCuerpo(): array
{
    $contenido = file_get_contents('php://input');
    if ($contenido === false || trim($contenido) === '') {
        return $_POST;
    }

    $json = json_decode($contenido, true);
    if (is_array($json)) {
        return $json;
    }

    parse_str($contenido, $datos);
    return is_array($datos) ? $datos : [];
}

function metodoHttp(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function ipCliente(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}
