<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'POST') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requirePermiso($conn, 'usuarios.gestionar');
$datos = leerCuerpo();

$id = (int) ($datos['idUsuario'] ?? 0);
if ($id <= 0) {
    responderError('Falta el identificador del usuario.', 422);
}

$stmt = $conn->prepare("
    SELECT u.id, u.email, u.activo, r.nombre AS rol
    FROM usuario u
    INNER JOIN rol r ON r.id = u.rol_id
    WHERE u.id = ?
    LIMIT 1
");
$stmt->bind_param('i', $id);
$stmt->execute();
$objetivo = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$objetivo) {
    responderError('Usuario no encontrado.', 404);
}

if (!esRolDev($actor) && $objetivo['rol'] !== 'empleado') {
    responderError('Solo un dev puede resetear claves de admins o devs.', 403);
}

$nueva = (string) ($datos['nuevaPassword'] ?? '');
$generada = false;

if ($nueva === '') {
    $nueva = bin2hex(random_bytes(5));
    $generada = true;
}

if (strlen($nueva) < 8) {
    responderError('La nueva contrasena debe tener al menos 8 caracteres.', 422);
}

$hash = password_hash($nueva, PASSWORD_BCRYPT);
$stmt = $conn->prepare('UPDATE usuario SET password_hash = ?, debeCambiarPassword = 1 WHERE id = ?');
$stmt->bind_param('si', $hash, $id);
$stmt->execute();
$stmt->close();

$stmt = $conn->prepare('UPDATE sesion SET revocada = 1 WHERE idUsuario = ?');
$stmt->bind_param('i', $id);
$stmt->execute();
$stmt->close();

registrarAuditoria($conn, (int) $actor['id'], 'usuario.reset_password', 'usuario', $id, [
    'email' => $objetivo['email'],
]);

responder([
    'ok' => true,
    'passwordTemporal' => $generada ? $nueva : null,
    'message' => 'Contrasena restablecida. El usuario debera cambiarla al ingresar.',
]);
