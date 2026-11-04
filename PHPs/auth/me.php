<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

responder(['usuario' => usuarioPublico($usuario)]);
