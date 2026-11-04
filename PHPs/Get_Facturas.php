<?php
declare(strict_types=1);

require_once __DIR__ . '/core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

$facturas = [];

if ($usuario['rol'] === 'empleado') {
    $idSucursal = $usuario['idSucursal'];

    if ($idSucursal === null) {
        responderError('Tu usuario no tiene una sucursal asignada.', 403);
    }

    $stmt = $conn->prepare('SELECT * FROM factura WHERE idSucursal = ? ORDER BY nroFactura ASC');
    $stmt->bind_param('i', $idSucursal);
    $stmt->execute();
    $resultado = $stmt->get_result();
} else {
    $resultado = $conn->query('SELECT * FROM factura ORDER BY nroFactura ASC');
}

while ($fila = $resultado->fetch_assoc()) {
    $fila['nroFactura'] = (int) $fila['nroFactura'];
    $fila['idCliente'] = (int) $fila['idCliente'];
    $fila['idSucursal'] = (int) $fila['idSucursal'];
    $fila['importe'] = (float) $fila['importe'];
    $fila['iva'] = (float) $fila['iva'];
    $facturas[] = $fila;
}

if (isset($stmt)) {
    $stmt->close();
}

responder($facturas);
