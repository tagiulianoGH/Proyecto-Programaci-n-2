<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

$metodo = metodoHttp();
if (!in_array($metodo, ['GET', 'PUT'], true)) {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$actor = requireRol($conn, ['dev']);
$clavesPermitidas = ['modoMantenimiento', 'mensajeMantenimiento', 'nombreEmpresa'];

if ($metodo === 'GET') {
    $resultado = $conn->query('SELECT clave, valor, actualizadoEn FROM configuracion ORDER BY clave ASC');
    $config = [];
    while ($fila = $resultado->fetch_assoc()) {
        $config[] = $fila;
    }

    responder($config);
}

$datos = leerCuerpo();
$cambios = 0;

$stmt = $conn->prepare("
    INSERT INTO configuracion (clave, valor) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE valor = VALUES(valor)
");

foreach ($clavesPermitidas as $clave) {
    if (!array_key_exists($clave, $datos)) {
        continue;
    }

    $valor = (string) $datos[$clave];

    if ($clave === 'modoMantenimiento') {
        $valor = $valor === '1' ? '1' : '0';
    }

    if ($clave === 'nombreEmpresa' && trim($valor) === '') {
        responderError('El nombre de la empresa no puede estar vacio.', 422);
    }

    $stmt->bind_param('ss', $clave, $valor);
    $stmt->execute();
    $cambios++;
}

$stmt->close();

registrarAuditoria($conn, (int) $actor['id'], 'dev.config_actualizar', 'configuracion', null, [
    'claves' => array_keys($datos),
]);

responder(['ok' => true, 'cambios' => $cambios, 'message' => 'Configuracion actualizada.']);
