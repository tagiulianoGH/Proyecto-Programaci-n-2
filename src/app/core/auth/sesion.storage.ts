import { SesionGuardada } from '../../models';

export const SESION_STORAGE_KEY = 'giulicorp.auth';

/**
 * Acceso a localStorage sin depender de Angular.
 * Lo usan tanto AuthService como el interceptor HTTP.
 */
export function leerSesion(): SesionGuardada | null {
  try {
    const crudo = localStorage.getItem(SESION_STORAGE_KEY);
    if (!crudo) {
      return null;
    }

    const sesion = JSON.parse(crudo) as SesionGuardada;

    if (!sesion?.token || !sesion?.usuario) {
      limpiarSesionLocal();
      return null;
    }

    if (sesion.expiraEn && new Date(sesion.expiraEn).getTime() <= Date.now()) {
      limpiarSesionLocal();
      return null;
    }

    return sesion;
  } catch {
    limpiarSesionLocal();
    return null;
  }
}

export function guardarSesionLocal(sesion: SesionGuardada): void {
  try {
    localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion));
  } catch {
    // Si el navegador bloquea localStorage se mantiene solo la sesion en memoria.
  }
}

export function limpiarSesionLocal(): void {
  try {
    localStorage.removeItem(SESION_STORAGE_KEY);
  } catch {
    // Nada para hacer.
  }
}

export function tokenActual(): string | null {
  return leerSesion()?.token ?? null;
}
