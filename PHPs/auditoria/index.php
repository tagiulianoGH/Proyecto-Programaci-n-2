<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requirePermiso($conn, 'auditoria.ver');

$limite = min(200, max(1, (int) ($_GET['limite'] ?? 50)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));
$accion = trim((string) ($_GET['accion'] ?? ''));
$desde = trim((string) ($_GET['desde'] ?? ''));

$filtros = ' WHERE 1 = 1';
$tipos = '';
$parametros = [];

if ($accion !== '') {
    $filtros .= ' AND a.accion LIKE ?';
    $tipos .= 's';
    $parametros[] = '%' . $accion . '%';
}

if ($desde !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $desde)) {
    $filtros .= ' AND a.creadoEn >= ?';
    $tipos .= 's';
    $parametros[] = $desde . ' 00:00:00';
}

$sqlTotal = 'SELECT COUNT(*) AS total FROM auditoria a' . $filtros;
$stmt = $conn->prepare($sqlTotal);
if ($tipos !== '') {
    $stmt->bind_param($tipos, ...$parametros);
}
$stmt->execute();
$total = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
$stmt->close();

$sql = "
    SELECT a.id, a.accion, a.entidad, a.entidadId, a.detalle, a.ip, a.creadoEn,
           u.nombre, u.apellido, u.email, r.nombre AS rol
    FROM auditoria a
    LEFT JOIN usuario u ON u.id = a.idUsuario
    LEFT JOIN rol r ON r.id = u.rol_id
" . $filtros . '
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
';

$stmt = $conn->prepare($sql);
$tiposLista = $tipos . 'ii';
$parametrosLista = array_merge($parametros, [$limite, $offset]);
$stmt->bind_param($tiposLista, ...$parametrosLista);
$stmt->execute();
$resultado = $stmt->get_result();

$items = [];
while ($fila = $resultado->fetch_assoc()) {
    $fila['id'] = (int) $fila['id'];
    $fila['entidadId'] = $fila['entidadId'] !== null ? (int) $fila['entidadId'] : null;
    $fila['detalle'] = $fila['detalle'] !== null ? json_decode((string) $fila['detalle'], true) : null;
    $items[] = $fila;
}

$stmt->close();

responder([
    'items' => $items,
    'total' => $total,
    'limite' => $limite,
    'offset' => $offset,
]);
