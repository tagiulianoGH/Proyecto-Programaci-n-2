<?php
declare(strict_types=1);

/**
 * Registro de acciones sensibles. Nunca interrumpe la operacion principal.
 */
function registrarAuditoria(
    mysqli $conn,
    ?int $idUsuario,
    string $accion,
    ?string $entidad = null,
    ?int $entidadId = null,
    ?array $detalle = null
): void {
    try {
        $sql = "
            INSERT INTO auditoria (idUsuario, accion, entidad, entidadId, detalle, ip)
            VALUES (?, ?, ?, ?, ?, ?)
        ";
        $stmt = $conn->prepare($sql);
        $json = $detalle !== null ? json_encode($detalle, JSON_UNESCAPED_UNICODE) : null;
        $ip = ipCliente();
        $stmt->bind_param('ississ', $idUsuario, $accion, $entidad, $entidadId, $json, $ip);
        $stmt->execute();
        $stmt->close();
    } catch (Throwable $e) {
        // La auditoria no debe romper la operacion del usuario.
    }
}
