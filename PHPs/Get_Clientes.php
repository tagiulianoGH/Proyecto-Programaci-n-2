<?php
declare(strict_types=1);

require_once __DIR__ . '/core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

$clientes = [];

if ($usuario['rol'] === 'empleado') {
    $idSucursal = $usuario['idSucursal'];

    if ($idSucursal === null) {
        responderError('Tu usuario no tiene una sucursal asignada.', 403);
    }

    // El empleado solo ve clientes con facturas en su sucursal.
    $stmt = $conn->prepare("
        SELECT c.*
        FROM cliente c
        WHERE EXISTS (
            SELECT 1 FROM factura f
            WHERE f.idCliente = c.id AND f.idSucursal = ?
        )
        ORDER BY c.id ASC
    ");
    $stmt->bind_param('i', $idSucursal);
    $stmt->execute();
    $resultado = $stmt->get_result();
} else {
    $resultado = $conn->query('SELECT * FROM cliente ORDER BY id ASC');
}

while ($fila = $resultado->fetch_assoc()) {
    $fila['id'] = (int) $fila['id'];
    $fila['dni'] = (int) $fila['dni'];
    $clientes[] = $fila;
}

if (isset($stmt)) {
    $stmt->close();
}

responder($clientes);
