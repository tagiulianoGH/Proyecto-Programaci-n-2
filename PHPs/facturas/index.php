<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

$limite = min(100, max(1, (int) ($_GET['limite'] ?? 25)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));
$busqueda = trim((string) ($_GET['q'] ?? ''));
$estado = trim((string) ($_GET['estado'] ?? ''));
$idSucursal = isset($_GET['idSucursal']) && $_GET['idSucursal'] !== ''
    ? (int) $_GET['idSucursal']
    : null;
$desde = trim((string) ($_GET['desde'] ?? ''));
$hasta = trim((string) ($_GET['hasta'] ?? ''));

$estadosValidos = ['Pendiente', 'Activo', 'Atrasado'];

$filtros = ' WHERE 1 = 1';
$tipos = '';
$parametros = [];

// Un empleado solo puede ver las facturas de su sucursal.
if (($usuario['rol'] ?? null) === 'empleado') {
    if ($usuario['idSucursal'] === null) {
        responderError('Tu usuario no tiene una sucursal asignada.', 403);
    }

    $idSucursal = (int) $usuario['idSucursal'];
}

if ($idSucursal !== null && $idSucursal > 0) {
    $filtros .= ' AND f.idSucursal = ?';
    $tipos .= 'i';
    $parametros[] = $idSucursal;
}

if ($estado !== '' && in_array($estado, $estadosValidos, true)) {
    $filtros .= ' AND f.estado = ?';
    $tipos .= 's';
    $parametros[] = $estado;
}

if ($desde !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $desde)) {
    $filtros .= ' AND f.fechaFactura >= ?';
    $tipos .= 's';
    $parametros[] = $desde;
}

if ($hasta !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $hasta)) {
    $filtros .= ' AND f.fechaFactura <= ?';
    $tipos .= 's';
    $parametros[] = $hasta;
}

if ($busqueda !== '') {
    $filtros .= ' AND (c.nombre LIKE ? OR c.apellido LIKE ? OR CAST(c.dni AS CHAR) LIKE ?';
    $like = '%' . $busqueda . '%';
    $tipos .= 'sss';
    $parametros[] = $like;
    $parametros[] = $like;
    $parametros[] = $like;

    if (ctype_digit($busqueda)) {
        $filtros .= ' OR f.nroFactura = ?';
        $tipos .= 'i';
        $parametros[] = (int) $busqueda;
    }

    $filtros .= ')';
}

$sqlTotal = "
    SELECT COUNT(*) AS total
    FROM factura f
    INNER JOIN cliente c ON c.id = f.idCliente
    INNER JOIN sucursal s ON s.id = f.idSucursal
" . $filtros;

$stmt = $conn->prepare($sqlTotal);
if ($tipos !== '') {
    $stmt->bind_param($tipos, ...$parametros);
}
$stmt->execute();
$total = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
$stmt->close();

$sql = "
    SELECT f.nroFactura, f.fechaFactura, f.idCliente, f.idSucursal,
           f.importe, f.iva, f.estado,
           c.nombre AS clienteNombre, c.apellido AS clienteApellido, c.dni AS clienteDni,
           s.nombre AS sucursalNombre, s.ciudad AS sucursalCiudad
    FROM factura f
    INNER JOIN cliente c ON c.id = f.idCliente
    INNER JOIN sucursal s ON s.id = f.idSucursal
" . $filtros . '
    ORDER BY f.nroFactura DESC
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
    $fila['nroFactura'] = (int) $fila['nroFactura'];
    $fila['idCliente'] = (int) $fila['idCliente'];
    $fila['idSucursal'] = (int) $fila['idSucursal'];
    $fila['clienteDni'] = (int) $fila['clienteDni'];
    $fila['importe'] = (float) $fila['importe'];
    $fila['iva'] = (float) $fila['iva'];
    $items[] = $fila;
}

$stmt->close();

responder([
    'items' => $items,
    'total' => $total,
    'limite' => $limite,
    'offset' => $offset,
]);
