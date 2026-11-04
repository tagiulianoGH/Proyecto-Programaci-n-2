<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'POST') {
    responderError('Metodo no permitido.', 405);
}

$datos = leerCuerpo();
$email = strtolower(trim((string) ($datos['email'] ?? '')));
$password = (string) ($datos['password'] ?? '');
$ip = ipCliente();

if ($email === '' || $password === '') {
    responderError('Ingresa tu email y contrasena.', 422);
}

$conn = conectarDB();

// Rate limiting: 5 fallos por email + IP en los ultimos 15 minutos.
$stmt = $conn->prepare("
    SELECT COUNT(*) AS total
    FROM intento_login
    WHERE email = ? AND ip = ? AND exito = 0
      AND creadoEn > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
");
$stmt->bind_param('ss', $email, $ip);
$stmt->execute();
$intentos = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
$stmt->close();

if ($intentos >= 5) {
    responderError('Demasiados intentos fallidos. Espera 15 minutos antes de reintentar.', 429);
}

$stmt = $conn->prepare("
    SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.idSucursal,
           u.activo, r.nombre AS rol, s.nombre AS sucursal
    FROM usuario u
    INNER JOIN rol r ON r.id = u.rol_id
    LEFT JOIN sucursal s ON s.id = u.idSucursal
    WHERE u.email = ?
    LIMIT 1
");
$stmt->bind_param('s', $email);
$stmt->execute();
$usuario = $stmt->get_result()->fetch_assoc();
$stmt->close();

$registrarIntento = function (bool $exito) use ($conn, $email, $ip): void {
    $stmt = $conn->prepare('INSERT INTO intento_login (email, ip, exito) VALUES (?, ?, ?)');
    $valor = $exito ? 1 : 0;
    $stmt->bind_param('ssi', $email, $ip, $valor);
    $stmt->execute();
    $stmt->close();
};

if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
    $registrarIntento(false);
    registrarAuditoria($conn, null, 'login.fallido', 'usuario', null, ['email' => $email]);
    responderError('Email o contrasena incorrectos.', 401);
}

if ((int) $usuario['activo'] !== 1) {
    $registrarIntento(false);
    registrarAuditoria($conn, (int) $usuario['id'], 'login.desactivado', 'usuario', (int) $usuario['id']);
    responderError('Tu usuario esta desactivado. Contacta a un administrador.', 403);
}

if (obtenerConfiguracion($conn, 'modoMantenimiento', '0') === '1' && $usuario['rol'] !== 'dev') {
    $registrarIntento(false);
    responderError(obtenerConfiguracion($conn, 'mensajeMantenimiento', 'Sistema en mantenimiento.'), 503);
}

$token = bin2hex(random_bytes(32));
$hash = hashToken($token);
$userAgent = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
$idUsuario = (int) $usuario['id'];

$stmt = $conn->prepare("
    INSERT INTO sesion (id, idUsuario, expiraEn, ip, userAgent)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?)
");
$duracion = SESION_DURACION_HORAS;
$stmt->bind_param('sisss', $hash, $idUsuario, $duracion, $ip, $userAgent);
$stmt->execute();
$stmt->close();

$stmt = $conn->prepare('SELECT expiraEn FROM sesion WHERE id = ? LIMIT 1');
$stmt->bind_param('s', $hash);
$stmt->execute();
$expiraEn = $stmt->get_result()->fetch_assoc()['expiraEn'] ?? null;
$stmt->close();

$stmt = $conn->prepare('UPDATE usuario SET ultimoLogin = NOW() WHERE id = ?');
$stmt->bind_param('i', $idUsuario);
$stmt->execute();
$stmt->close();

$registrarIntento(true);
registrarAuditoria($conn, $idUsuario, 'login.ok', 'usuario', $idUsuario);

$usuarioSesion = [
    'id' => $idUsuario,
    'nombre' => $usuario['nombre'],
    'apellido' => $usuario['apellido'],
    'email' => $usuario['email'],
    'rol' => $usuario['rol'],
    'idSucursal' => $usuario['idSucursal'] !== null ? (int) $usuario['idSucursal'] : null,
    'sucursal' => $usuario['sucursal'] ?? null,
    'permisos' => permisosDeRol($usuario['rol']),
    'debeCambiarPassword' => (int) ($usuario['debeCambiarPassword'] ?? 0) === 1,
];

responder([
    'token' => $token,
    'expiraEn' => $expiraEn,
    'usuario' => $usuarioSesion,
]);
