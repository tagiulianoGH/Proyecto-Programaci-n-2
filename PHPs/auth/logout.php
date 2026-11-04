<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'POST') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

$stmt = $conn->prepare('UPDATE sesion SET revocada = 1 WHERE id = ?');
$stmt->bind_param('s', $usuario['idSesion']);
$stmt->execute();
$stmt->close();

registrarAuditoria($conn, (int) $usuario['id'], 'logout', 'usuario', (int) $usuario['id']);

responder(['ok' => true]);
