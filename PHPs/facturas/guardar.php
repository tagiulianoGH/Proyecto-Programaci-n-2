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
$estados = ['Pendiente', 'Activo', 'Atrasado'];

if ($metodo === 'DELETE') {
    $nroFactura = (int) ($_GET['nroFactura'] ?? $datos['nroFactura'] ?? 0);
    if ($nroFactura <= 0) {
        responderError('Falta el numero de factura.', 422);
    }

    $stmt = $conn->prepare('DELETE FROM factura WHERE nroFactura = ?');
    $stmt->bind_param('i', $nroFactura);
    $stmt->execute();
    $afectados = $stmt->affected_rows;
    $stmt->close();

    if ($afectados === 0) {
        responderError('Factura no encontrada.', 404);
    }

    registrarAuditoria($conn, (int) $actor['id'], 'factura.eliminar', 'factura', $nroFactura);
    responder(['ok' => true, 'message' => 'Factura eliminada.']);
}

$fecha = (string) ($datos['fechaFactura'] ?? '');
$idCliente = (int) ($datos['idCliente'] ?? 0);
$idSucursal = (int) ($datos['idSucursal'] ?? 0);
$importe = round((float) ($datos['importe'] ?? 0), 2);
$estado = (string) ($datos['estado'] ?? 'Pendiente');

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    responderError('La fecha de la factura no es valida.', 422);
}

if ($idCliente <= 0 || $idSucursal <= 0) {
    responderError('Cliente y sucursal son obligatorios.', 422);
}

if ($importe <= 0) {
    responderError('El importe debe ser mayor a cero.', 422);
}

if (!in_array($estado, $estados, true)) {
    responderError('Estado de factura invalido.', 422);
}

$stmt = $conn->prepare('SELECT id FROM cliente WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $idCliente);
$stmt->execute();
$existeCliente = $stmt->get_result()->fetch_assoc();
$stmt->close();

$stmt = $conn->prepare('SELECT id FROM sucursal WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $idSucursal);
$stmt->execute();
$existeSucursal = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$existeCliente || !$existeSucursal) {
    responderError('El cliente o la sucursal indicada no existe.', 422);
}

$iva = round($importe * 0.21, 2);

if ($metodo === 'POST') {
    $stmt = $conn->prepare("
        INSERT INTO factura (fechaFactura, idCliente, idSucursal, importe, iva, estado)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('siidds', $fecha, $idCliente, $idSucursal, $importe, $iva, $estado);
    $stmt->execute();
    $nroFactura = (int) $conn->insert_id;
    $stmt->close();

    registrarAuditoria($conn, (int) $actor['id'], 'factura.crear', 'factura', $nroFactura, [
        'importe' => $importe,
        'idCliente' => $idCliente,
        'idSucursal' => $idSucursal,
    ]);

    responder(['ok' => true, 'nroFactura' => $nroFactura, 'message' => 'Factura creada.'], 201);
}

$nroFactura = (int) ($datos['nroFactura'] ?? 0);
if ($nroFactura <= 0) {
    responderError('Falta el numero de factura.', 422);
}

$stmt = $conn->prepare("
    UPDATE factura
    SET fechaFactura = ?, idCliente = ?, idSucursal = ?, importe = ?, iva = ?, estado = ?
    WHERE nroFactura = ?
");
$stmt->bind_param('siiddsi', $fecha, $idCliente, $idSucursal, $importe, $iva, $estado, $nroFactura);
$stmt->execute();
$afectados = $stmt->affected_rows;
$stmt->close();

if ($afectados === 0) {
    responderError('Factura no encontrada o sin cambios.', 404);
}

registrarAuditoria($conn, (int) $actor['id'], 'factura.actualizar', 'factura', $nroFactura, [
    'importe' => $importe,
    'estado' => $estado,
]);

responder(['ok' => true, 'message' => 'Factura actualizada.']);
