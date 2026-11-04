<?php
declare(strict_types=1);

require_once __DIR__ . '/core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

$sucursales = [];

if ($usuario['rol'] === 'empleado') {
    $idSucursal = $usuario['idSucursal'];

    if ($idSucursal === null) {
        responderError('Tu usuario no tiene una sucursal asignada.', 403);
    }

    $stmt = $conn->prepare('SELECT * FROM sucursal WHERE id = ? ORDER BY id ASC');
    $stmt->bind_param('i', $idSucursal);
    $stmt->execute();
    $resultado = $stmt->get_result();
} else {
    $resultado = $conn->query('SELECT * FROM sucursal ORDER BY id ASC');
}

while ($fila = $resultado->fetch_assoc()) {
    $fila['id'] = (int) $fila['id'];
    $fila['cantEmpleados'] = (int) $fila['cantEmpleados'];
    $sucursales[] = $fila;
}

if (isset($stmt)) {
    $stmt->close();
}

responder($sucursales);
