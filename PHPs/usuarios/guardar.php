<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

$metodo = metodoHttp();
if (!in_array($metodo, ['POST', 'PUT'], true)) {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requirePermiso($conn, 'usuarios.gestionar');
$esDev = esRolDev($actor);
$datos = leerCuerpo();

$rolesPermitidos = $esDev ? ['empleado', 'admin', 'dev'] : ['empleado'];

function rolId(mysqli $conn, string $rol): int
{
    $stmt = $conn->prepare('SELECT id FROM rol WHERE nombre = ? LIMIT 1');
    $stmt->bind_param('s', $rol);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$fila) {
        responderError('Rol invalido.', 422);
    }

    return (int) $fila['id'];
}

function contarOtrosDevsActivos(mysqli $conn, int $excluirId): int
{
    $stmt = $conn->prepare("
        SELECT COUNT(*) AS total
        FROM usuario u
        INNER JOIN rol r ON r.id = u.rol_id
        WHERE r.nombre = 'dev' AND u.activo = 1 AND u.id <> ?
    ");
    $stmt->bind_param('i', $excluirId);
    $stmt->execute();
    $total = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
    $stmt->close();

    return $total;
}

function validarSucursal(mysqli $conn, ?int $idSucursal): int
{
    if ($idSucursal === null || $idSucursal <= 0) {
        responderError('Los usuarios empleado deben tener una sucursal asignada.', 422);
    }

    $stmt = $conn->prepare('SELECT id FROM sucursal WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $idSucursal);
    $stmt->execute();
    $existe = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$existe) {
        responderError('La sucursal indicada no existe.', 422);
    }

    return $idSucursal;
}

if ($metodo === 'POST') {
    $nombre = trim((string) ($datos['nombre'] ?? ''));
    $apellido = trim((string) ($datos['apellido'] ?? ''));
    $email = strtolower(trim((string) ($datos['email'] ?? '')));
    $password = (string) ($datos['password'] ?? '');
    $rol = (string) ($datos['rol'] ?? 'empleado');
    $idSucursal = isset($datos['idSucursal']) && $datos['idSucursal'] !== null && $datos['idSucursal'] !== ''
        ? (int) $datos['idSucursal']
        : null;

    if ($nombre === '' || $apellido === '' || $email === '') {
        responderError('Nombre, apellido y email son obligatorios.', 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responderError('El email no es valido.', 422);
    }

    if (strlen($password) < 8) {
        responderError('La contrasena debe tener al menos 8 caracteres.', 422);
    }

    if (!in_array($rol, $rolesPermitidos, true)) {
        responderError('No podes crear usuarios con ese rol.', 403);
    }

    if ($rol !== 'empleado') {
        $idSucursal = null;
    } else {
        $idSucursal = validarSucursal($conn, $idSucursal);
    }

    $stmt = $conn->prepare('SELECT id FROM usuario WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $existe = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($existe) {
        responderError('Ya existe un usuario con ese email.', 409);
    }

    $rolId = rolId($conn, $rol);
    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $conn->prepare("
        INSERT INTO usuario (nombre, apellido, email, password_hash, rol_id, idSucursal, activo, creadoPor)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    ");
    $stmt->bind_param('ssssiii', $nombre, $apellido, $email, $hash, $rolId, $idSucursal, $actor['id']);
    $stmt->execute();
    $idNuevo = (int) $conn->insert_id;
    $stmt->close();

    registrarAuditoria($conn, (int) $actor['id'], 'usuario.crear', 'usuario', $idNuevo, [
        'email' => $email,
        'rol' => $rol,
        'idSucursal' => $idSucursal,
    ]);

    responder([
        'ok' => true,
        'id' => $idNuevo,
        'message' => 'Usuario creado correctamente.',
    ], 201);
}

// PUT: actualizar usuario existente.
$id = (int) ($datos['id'] ?? 0);
if ($id <= 0) {
    responderError('Falta el identificador del usuario.', 422);
}

$stmt = $conn->prepare("
    SELECT u.id, u.nombre, u.apellido, u.email, u.rol_id, u.idSucursal, u.activo, r.nombre AS rol
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

if (!$esDev && $objetivo['rol'] !== 'empleado') {
    responderError('No podes modificar usuarios con rol admin o dev.', 403);
}

$nombre = trim((string) ($datos['nombre'] ?? $objetivo['nombre']));
$apellido = trim((string) ($datos['apellido'] ?? $objetivo['apellido']));
$email = strtolower(trim((string) ($datos['email'] ?? $objetivo['email'])));
$rol = (string) ($datos['rol'] ?? $objetivo['rol']);
$activo = array_key_exists('activo', $datos) ? ((int) $datos['activo'] === 1 ? 1 : 0) : (int) $objetivo['activo'];
$password = (string) ($datos['password'] ?? '');
$idSucursal = array_key_exists('idSucursal', $datos)
    ? ($datos['idSucursal'] !== null && $datos['idSucursal'] !== '' ? (int) $datos['idSucursal'] : null)
    : ($objetivo['idSucursal'] !== null ? (int) $objetivo['idSucursal'] : null);

if ($nombre === '' || $apellido === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responderError('Los datos del usuario no son validos.', 422);
}

if (!in_array($rol, $rolesPermitidos, true)) {
    responderError('No podes asignar ese rol.', 403);
}

if (!$esDev && $rol !== 'empleado') {
    responderError('No podes asignar roles admin o dev.', 403);
}

if ($id === (int) $actor['id'] && ($rol !== $objetivo['rol'] || $activo === 0)) {
    responderError('No podes cambiar tu propio rol ni desactivar tu usuario.', 422);
}

if ($objetivo['rol'] === 'dev' && ($rol !== 'dev' || $activo === 0) && contarOtrosDevsActivos($conn, $id) === 0) {
    responderError('Debe quedar al menos un usuario dev activo.', 422);
}

if ($rol === 'empleado') {
    $idSucursal = validarSucursal($conn, $idSucursal);
} else {
    $idSucursal = null;
}

$stmt = $conn->prepare('SELECT id FROM usuario WHERE email = ? AND id <> ? LIMIT 1');
$stmt->bind_param('si', $email, $id);
$stmt->execute();
$existe = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($existe) {
    responderError('Ya existe otro usuario con ese email.', 409);
}

$rolId = rolId($conn, $rol);

$stmt = $conn->prepare("
    UPDATE usuario
    SET nombre = ?, apellido = ?, email = ?, rol_id = ?, idSucursal = ?, activo = ?
    WHERE id = ?
");
$stmt->bind_param('sssiiii', $nombre, $apellido, $email, $rolId, $idSucursal, $activo, $id);
$stmt->execute();
$stmt->close();

if ($password !== '') {
    if (strlen($password) < 8) {
        responderError('La nueva contrasena debe tener al menos 8 caracteres.', 422);
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $conn->prepare('UPDATE usuario SET password_hash = ?, debeCambiarPassword = 1 WHERE id = ?');
    $stmt->bind_param('si', $hash, $id);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare('UPDATE sesion SET revocada = 1 WHERE idUsuario = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
}

registrarAuditoria($conn, (int) $actor['id'], 'usuario.actualizar', 'usuario', $id, [
    'email' => $email,
    'rol' => $rol,
    'activo' => $activo,
    'idSucursal' => $idSucursal,
    'passwordCambiada' => $password !== '',
]);

responder(['ok' => true, 'message' => 'Usuario actualizado correctamente.']);
