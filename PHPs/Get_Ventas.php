<?php
declare(strict_types=1);

require_once __DIR__ . '/core/bootstrap.php';

if (metodoHttp() !== 'GET') {
    responderError('Metodo no permitido.', 405);
}

$conn = conectarDB();
$usuario = requireAuth($conn);

$idSucursalFiltro = null;
if ($usuario['rol'] === 'empleado') {
    $idSucursalFiltro = $usuario['idSucursal'];

    if ($idSucursalFiltro === null) {
        responderError('Tu usuario no tiene una sucursal asignada.', 403);
    }
}

/*
 * Año a consultar: por defecto el último año presente en la tabla factura.
 * Se puede forzar con ?anio=2026 (solo se aceptan dígitos).
 */
$anio = 0;
$resAnio = $conn->query('SELECT COALESCE(MAX(YEAR(fechaFactura)), YEAR(CURDATE())) AS anio FROM factura');
if ($resAnio) {
    $filaAnio = $resAnio->fetch_assoc();
    $anio = (int) $filaAnio['anio'];
}

if (isset($_GET['anio']) && ctype_digit((string) $_GET['anio'])) {
    $anio = (int) $_GET['anio'];
}

/*
 * Total vendido por mes y sucursal.
 * El IVA es un impuesto: a cada factura se le suma el 21 % de su importe.
 * La sucursal se identifica con el nombre de su ciudad (Santa Fe, Rafaela, ...).
 */
$sql = "
    SELECT
        YEAR(f.fechaFactura)                      AS anio,
        MONTH(f.fechaFactura)                     AS mes,
        f.idSucursal                              AS idSucursal,
        s.ciudad                                  AS sucursal,
        COUNT(*)                                  AS cantidadFacturas,
        ROUND(SUM(f.importe * 1.21), 2)           AS totalConIva
    FROM factura f
    INNER JOIN sucursal s ON s.id = f.idSucursal
    WHERE YEAR(f.fechaFactura) = ?
";

if ($idSucursalFiltro !== null) {
    $sql .= ' AND f.idSucursal = ?';
}

$sql .= '
    GROUP BY YEAR(f.fechaFactura), MONTH(f.fechaFactura), f.idSucursal, s.ciudad
    ORDER BY mes ASC, f.idSucursal ASC
';

$stmt = $conn->prepare($sql);

if ($idSucursalFiltro !== null) {
    $stmt->bind_param('ii', $anio, $idSucursalFiltro);
} else {
    $stmt->bind_param('i', $anio);
}

$stmt->execute();
$resultado = $stmt->get_result();

$ventas = [];
while ($fila = $resultado->fetch_assoc()) {
    $fila['anio'] = (int) $fila['anio'];
    $fila['mes'] = (int) $fila['mes'];
    $fila['idSucursal'] = (int) $fila['idSucursal'];
    $fila['cantidadFacturas'] = (int) $fila['cantidadFacturas'];
    $fila['totalConIva'] = (float) $fila['totalConIva'];
    $ventas[] = $fila;
}

$stmt->close();

responder($ventas);
