<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requirePermiso($conn, 'usuarios.gestionar');
$esDev = esRolDev($usuario);

$sql = "
    SELECT u.id, u.nombre, u.apellido, u.email, u.activo, u.idSucursal,
           u.ultimoLogin, u.creadoEn, r.nombre AS rol, s.nombre AS sucursal
    FROM usuario u
    INNER JOIN rol r ON r.id = u.rol_id
    LEFT JOIN sucursal s ON s.id = u.idSucursal
    WHERE 1 = 1
";
$tipos = '';
$parametros = [];

if (!$esDev) {
    $sql .= " AND r.nombre = 'empleado'";
}

$busqueda = trim((string) ($_GET['q'] ?? ''));
if ($busqueda !== '') {
    $sql .= ' AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)';
    $like = '%' . $busqueda . '%';
    $tipos .= 'sss';
    $parametros[] = $like;
    $parametros[] = $like;
    $parametros[] = $like;
}

$sql .= ' ORDER BY r.id ASC, u.apellido ASC, u.nombre ASC';

$stmt = $conn->prepare($sql);
if ($tipos !== '') {
    $stmt->bind_param($tipos, ...$parametros);
}
$stmt->execute();
$resultado = $stmt->get_result();

$usuarios = [];
while ($fila = $resultado->fetch_assoc()) {
    $fila['id'] = (int) $fila['id'];
    $fila['idSucursal'] = $fila['idSucursal'] !== null ? (int) $fila['idSucursal'] : null;
    $fila['activo'] = (int) $fila['activo'] === 1;
    $usuarios[] = $fila;
}

$stmt->close();
responder($usuarios);
