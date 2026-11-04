<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'POST') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requireRol($conn, ['dev']);
$datos = leerCuerpo();

$id = (int) ($datos['idUsuario'] ?? 0);
$nuevoRol = (string) ($datos['rol'] ?? '');
$rolesValidos = ['empleado', 'admin', 'dev'];

if ($id <= 0 || !in_array($nuevoRol, $rolesValidos, true)) {
    responderError('Datos invalidos.', 422);
}

if ($id === (int) $actor['id']) {
    responderError('No podes cambiar tu propio rol.', 422);
}

$stmt = $conn->prepare("
    SELECT u.id, u.email, u.activo, u.idSucursal, r.nombre AS rol
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

if ($objetivo['rol'] === 'dev' && $nuevoRol !== 'dev') {
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM usuario u
        INNER JOIN rol r ON r.id = u.rol_id
        WHERE r.nombre = 'dev' AND u.activo = 1 AND u.id <> ?
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $otros = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
    $stmt->close();

    if ($otros === 0) {
        responderError('Debe quedar al menos un usuario dev activo.', 422);
    }
}

$idSucursal = null;
if ($nuevoRol === 'empleado') {
    $idSucursal = isset($datos['idSucursal']) && $datos['idSucursal'] !== ''
        ? (int) $datos['idSucursal']
        : ($objetivo['idSucursal'] !== null ? (int) $objetivo['idSucursal'] : null);

    if ($idSucursal === null) {
        responderError('Los usuarios empleado deben tener una sucursal asignada.', 422);
    }
}

$stmt = $conn->prepare('SELECT id FROM rol WHERE nombre = ? LIMIT 1');
$stmt->bind_param('s', $nuevoRol);
$stmt->execute();
$rolId = (int) ($stmt->get_result()->fetch_assoc()['id'] ?? 0);
$stmt->close();

$stmt = $conn->prepare('UPDATE usuario SET rol_id = ?, idSucursal = ? WHERE id = ?');
$stmt->bind_param('iii', $rolId, $idSucursal, $id);
$stmt->execute();
$stmt->close();

// Forzar un nuevo login con el rol actualizado.
$stmt = $conn->prepare('UPDATE sesion SET revocada = 1 WHERE idUsuario = ?');
$stmt->bind_param('i', $id);
$stmt->execute();
$stmt->close();

registrarAuditoria($conn, (int) $actor['id'], 'usuario.cambiar_rol', 'usuario', $id, [
    'email' => $objetivo['email'],
    'rolAnterior' => $objetivo['rol'],
    'rolNuevo' => $nuevoRol,
]);

responder(['ok' => true, 'message' => 'Rol actualizado correctamente.']);
