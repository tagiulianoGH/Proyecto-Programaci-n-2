import { Rol, UsuarioSesion } from '../../models';

export const ETIQUETAS_ROL: Record<Rol, string> = {
  empleado: 'Empleado',
  admin: 'Administrador',
  dev: 'Desarrollador',
};

/**
 * Espejo de la matriz de permisos del backend.
 * Solo se usa para mostrar u ocultar opciones: PHP siempre revalida.
 */
export const PERMISOS_POR_ROL: Record<Rol, string[]> = {
  empleado: ['datos.ver', 'perfil.editar'],
  admin: [
    'datos.ver',
    'perfil.editar',
    'datos.gestionar',
    'usuarios.gestionar',
    'auditoria.ver',
    'reportes.exportar',
  ],
  dev: ['*'],
};

export function permisosDeRol(rol: Rol): string[] {
  return PERMISOS_POR_ROL[rol] ?? [];
}

export function tienePermiso(usuario: UsuarioSesion | null, permiso: string): boolean {
  if (!usuario) {
    return false;
  }

  const permisos = usuario.permisos?.length ? usuario.permisos : permisosDeRol(usuario.rol);
  return permisos.includes('*') || permisos.includes(permiso);
}
