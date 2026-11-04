<?php
declare(strict_types=1);

/**
 * Conexion unica a la base de datos `sistema_facturacion`.
 * Configuracion pensada para XAMPP (root sin contrasena).
 */

const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASSWORD = '';
const DB_NAME = 'sistema_facturacion';

function conectarDB(): mysqli
{
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
        $conn->set_charset('utf8mb4');
        return $conn;
    } catch (Throwable $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'error' => true,
            'message' => 'Error de conexion a la base de datos.',
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
