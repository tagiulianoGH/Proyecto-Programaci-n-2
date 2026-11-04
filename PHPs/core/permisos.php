<?php
declare(strict_types=1);

/**
 * Matriz de permisos por rol.
 * El backend es la fuente de verdad: Angular solo replica esto para la UI.
 */

function matrizPermisos(): array
{
    $empleado = [
        'datos.ver',
        'perfil.editar',
    ];

    $admin = array_merge($empleado, [
        'datos.gestionar',
        'usuarios.gestionar',
        'auditoria.ver',
        'reportes.exportar',
    ]);

    return [
        'empleado' => $empleado,
        'admin' => $admin,
        // El dev accede a todo.
        'dev' => ['*'],
    ];
}

function permisosDeRol(?string $rol): array
{
    if ($rol === null) {
        return [];
    }

    return matrizPermisos()[$rol] ?? [];
}

function tienePermiso(array $usuario, string $permiso): bool
{
    $rol = $usuario['rol'] ?? null;
    $permisos = permisosDeRol(is_string($rol) ? $rol : null);

    return in_array('*', $permisos, true) || in_array($permiso, $permisos, true);
}

function esRolDev(array $usuario): bool
{
    return ($usuario['rol'] ?? null) === 'dev';
}

function esRolAdminODiv(array $usuario): bool
{
    return in_array($usuario['rol'] ?? null, ['admin', 'dev'], true);
}
