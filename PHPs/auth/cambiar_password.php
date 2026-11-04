<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'POST') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);
$datos = leerCuerpo();

$actual = (string) ($datos['actual'] ?? '');
$nueva = (string) ($datos['nueva'] ?? '');

if ($actual === '' || $nueva === '') {
    responderError('Completa la contrasena actual y la nueva.', 422);
}

if (strlen($nueva) < 8) {
    responderError('La nueva contrasena debe tener al menos 8 caracteres.', 422);
}

$stmt = $conn->prepare('SELECT password_hash FROM usuario WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $usuario['id']);
$stmt->execute();
$fila = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$fila || !password_verify($actual, $fila['password_hash'])) {
    responderError('La contrasena actual no es correcta.', 401);
}

$hash = password_hash($nueva, PASSWORD_BCRYPT);
$stmt = $conn->prepare('UPDATE usuario SET password_hash = ?, debeCambiarPassword = 0 WHERE id = ?');
$stmt->bind_param('si', $hash, $usuario['id']);
$stmt->execute();
$stmt->close();

// Cerrar las demas sesiones del usuario.
$stmt = $conn->prepare('UPDATE sesion SET revocada = 1 WHERE idUsuario = ? AND id <> ?');
$stmt->bind_param('is', $usuario['id'], $usuario['idSesion']);
$stmt->execute();
$stmt->close();

registrarAuditoria($conn, (int) $usuario['id'], 'password.cambiar', 'usuario', (int) $usuario['id']);

responder(['ok' => true, 'message' => 'Contrasena actualizada correctamente.']);
