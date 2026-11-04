<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

$metodo = metodoHttp();
if (!in_array($metodo, ['POST', 'PUT', 'DELETE'], true)) {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requirePermiso($conn, 'datos.gestionar');
$datos = leerCuerpo();

if ($metodo === 'DELETE') {
    $id = (int) ($_GET['id'] ?? $datos['id'] ?? 0);
    if ($id <= 0) {
        responderError('Falta el identificador de la sucursal.', 422);
    }

    $stmt = $conn->prepare('SELECT COUNT(*) AS total FROM factura WHERE idSucursal = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $facturas = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
    $stmt->close();

    if ($facturas > 0) {
        responderError('No se puede eliminar una sucursal con facturas asociadas.', 409);
    }

    $stmt = $conn->prepare('SELECT COUNT(*) AS total FROM usuario WHERE idSucursal = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $usuarios = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
    $stmt->close();

    if ($usuarios > 0) {
        responderError('No se puede eliminar una sucursal con usuarios asignados.', 409);
    }

    $stmt = $conn->prepare('DELETE FROM sucursal WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $afectados = $stmt->affected_rows;
    $stmt->close();

    if ($afectados === 0) {
        responderError('Sucursal no encontrada.', 404);
    }

    registrarAuditoria($conn, (int) $actor['id'], 'sucursal.eliminar', 'sucursal', $id);
    responder(['ok' => true, 'message' => 'Sucursal eliminada.']);
}

$nombre = trim((string) ($datos['nombre'] ?? ''));
$ciudad = trim((string) ($datos['ciudad'] ?? ''));
$direccion = trim((string) ($datos['direccion'] ?? ''));
$cantEmpleados = (int) ($datos['cantEmpleados'] ?? 0);

if ($nombre === '' || $ciudad === '' || $direccion === '') {
    responderError('Nombre, ciudad y direccion son obligatorios.', 422);
}

if ($cantEmpleados < 0) {
    responderError('La cantidad de empleados no puede ser negativa.', 422);
}

if ($metodo === 'POST') {
    $stmt = $conn->prepare('INSERT INTO sucursal (nombre, ciudad, direccion, cantEmpleados) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('sssi', $nombre, $ciudad, $direccion, $cantEmpleados);
    $stmt->execute();
    $id = (int) $conn->insert_id;
    $stmt->close();

    registrarAuditoria($conn, (int) $actor['id'], 'sucursal.crear', 'sucursal', $id, [
        'nombre' => $nombre,
        'ciudad' => $ciudad,
    ]);

    responder(['ok' => true, 'id' => $id, 'message' => 'Sucursal creada.'], 201);
}

$id = (int) ($datos['id'] ?? 0);
if ($id <= 0) {
    responderError('Falta el identificador de la sucursal.', 422);
}

$stmt = $conn->prepare('UPDATE sucursal SET nombre = ?, ciudad = ?, direccion = ?, cantEmpleados = ? WHERE id = ?');
$stmt->bind_param('sssii', $nombre, $ciudad, $direccion, $cantEmpleados, $id);
$stmt->execute();
$afectados = $stmt->affected_rows;
$stmt->close();

if ($afectados === 0) {
    responderError('Sucursal no encontrada o sin cambios.', 404);
}

registrarAuditoria($conn, (int) $actor['id'], 'sucursal.actualizar', 'sucursal', $id, [
    'nombre' => $nombre,
    'ciudad' => $ciudad,
]);

responder(['ok' => true, 'message' => 'Sucursal actualizada.']);
