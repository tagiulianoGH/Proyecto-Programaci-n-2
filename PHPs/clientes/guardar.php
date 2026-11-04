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
$situaciones = ['Responsable Inscripto', 'Monotributista', 'Exento', 'Consumidor final', 'No categorizado'];

function validarCliente(array $datos): array
{
    global $situaciones;

    $nombre = trim((string) ($datos['nombre'] ?? ''));
    $apellido = trim((string) ($datos['apellido'] ?? ''));
    $situacion = (string) ($datos['situacionFiscal'] ?? '');
    $dni = (int) ($datos['dni'] ?? 0);

    if ($nombre === '' || $apellido === '') {
        responderError('Nombre y apellido son obligatorios.', 422);
    }

    if (!in_array($situacion, $situaciones, true)) {
        responderError('Situacion fiscal invalida.', 422);
    }

    if ($dni <= 0 || $dni > 99999999) {
        responderError('El DNI no es valido.', 422);
    }

    return [$nombre, $apellido, $situacion, $dni];
}

if ($metodo === 'DELETE') {
    $id = (int) ($_GET['id'] ?? $datos['id'] ?? 0);
    if ($id <= 0) {
        responderError('Falta el identificador del cliente.', 422);
    }

    $stmt = $conn->prepare('SELECT COUNT(*) AS total FROM factura WHERE idCliente = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $facturas = (int) ($stmt->get_result()->fetch_assoc()['total'] ?? 0);
    $stmt->close();

    if ($facturas > 0) {
        responderError('No se puede eliminar un cliente con facturas asociadas.', 409);
    }

    $stmt = $conn->prepare('DELETE FROM cliente WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $afectados = $stmt->affected_rows;
    $stmt->close();

    if ($afectados === 0) {
        responderError('Cliente no encontrado.', 404);
    }

    registrarAuditoria($conn, (int) $actor['id'], 'cliente.eliminar', 'cliente', $id);
    responder(['ok' => true, 'message' => 'Cliente eliminado.']);
}

[$nombre, $apellido, $situacion, $dni] = validarCliente($datos);

if ($metodo === 'POST') {
    $stmt = $conn->prepare('INSERT INTO cliente (nombre, apellido, situacionFiscal, dni) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('sssi', $nombre, $apellido, $situacion, $dni);
    $stmt->execute();
    $id = (int) $conn->insert_id;
    $stmt->close();

    registrarAuditoria($conn, (int) $actor['id'], 'cliente.crear', 'cliente', $id, [
        'nombre' => $nombre . ' ' . $apellido,
        'dni' => $dni,
    ]);

    responder(['ok' => true, 'id' => $id, 'message' => 'Cliente creado.'], 201);
}

$id = (int) ($datos['id'] ?? 0);
if ($id <= 0) {
    responderError('Falta el identificador del cliente.', 422);
}

$stmt = $conn->prepare('UPDATE cliente SET nombre = ?, apellido = ?, situacionFiscal = ?, dni = ? WHERE id = ?');
$stmt->bind_param('sssii', $nombre, $apellido, $situacion, $dni, $id);
$stmt->execute();
$afectados = $stmt->affected_rows;
$stmt->close();

if ($afectados === 0) {
    responderError('Cliente no encontrado o sin cambios.', 404);
}

registrarAuditoria($conn, (int) $actor['id'], 'cliente.actualizar', 'cliente', $id, [
    'nombre' => $nombre . ' ' . $apellido,
    'dni' => $dni,
]);

responder(['ok' => true, 'message' => 'Cliente actualizado.']);
