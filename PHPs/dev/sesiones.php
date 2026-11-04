<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

$metodo = metodoHttp();
if (!in_array($metodo, ['GET', 'DELETE'], true)) {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requireRol($conn, ['dev']);

if ($metodo === 'DELETE') {
    $id = trim((string) ($_GET['id'] ?? (leerCuerpo()['id'] ?? '')));

    if ($id === '') {
        responderError('Falta el identificador de la sesion.', 422);
    }

    $stmt = $conn->prepare('UPDATE sesion SET revocada = 1 WHERE id = ?');
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $afectados = $stmt->affected_rows;
    $stmt->close();

    if ($afectados === 0) {
        responderError('Sesion no encontrada.', 404);
    }

    registrarAuditoria($conn, (int) $actor['id'], 'dev.sesion_revocar', 'sesion', null, [
        'sesion' => substr($id, 0, 12) . '...',
    ]);

    responder(['ok' => true, 'message' => 'Sesion revocada.']);
}

$stmt = $conn->query("
    SELECT s.id, s.expiraEn, s.creadaEn, s.ip, s.userAgent,
           u.id AS idUsuario, u.nombre, u.apellido, u.email, r.nombre AS rol
    FROM sesion s
    INNER JOIN usuario u ON u.id = s.idUsuario
    INNER JOIN rol r ON r.id = u.rol_id
    WHERE s.revocada = 0 AND s.expiraEn > NOW()
    ORDER BY s.creadaEn DESC
");

$sesiones = [];
while ($fila = $stmt->fetch_assoc()) {
    $fila['idCorta'] = substr((string) $fila['id'], 0, 12) . '...';
    $fila['idUsuario'] = (int) $fila['idUsuario'];
    $sesiones[] = $fila;
}

responder($sesiones);
