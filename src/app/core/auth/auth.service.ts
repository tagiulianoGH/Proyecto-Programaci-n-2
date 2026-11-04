import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { LoginResponse, Rol, SesionGuardada, UsuarioSesion } from '../../models';
import { tienePermiso } from './permisos';
import { guardarSesionLocal, leerSesion, limpiarSesionLocal } from './sesion.storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sesionSignal = signal<SesionGuardada | null>(leerSesion());

  readonly usuario = computed(() => this.sesionSignal()?.usuario ?? null);
  readonly token = computed(() => this.sesionSignal()?.token ?? null);
  readonly autenticado = computed(() => this.sesionSignal() !== null);
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);
  readonly esDev = computed(() => this.rol() === 'dev');
  readonly esAdmin = computed(() => this.rol() === 'admin' || this.rol() === 'dev');
  readonly nombreCompleto = computed(() => {
    const usuario = this.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  /** Indica si el usuario debe cambiar su contraseña en el primer ingreso. */
  readonly debeCambiarPassword = computed(() => this.usuario()?.debeCambiarPassword ?? false);

  /** Indica si la sesión expira en menos de 30 minutos. */
  readonly sesionExpiraPronto = computed(() => {
    const sesion = this.sesionSignal();
    if (!sesion?.expiraEn) {
      return false;
    }
    const ahora = Date.now();
    const expira = new Date(sesion.expiraEn).getTime();
    const treintaMin = 30 * 60 * 1000;
    return expira > ahora && expira - ahora < treintaMin;
  });

  login(email: string, password: string): Observable<UsuarioSesion> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login.php`, { email, password })
      .pipe(
        tap((respuesta) => {
          const sesion: SesionGuardada = {
            token: respuesta.token,
            expiraEn: respuesta.expiraEn,
            usuario: respuesta.usuario,
          };
          this.sesionSignal.set(sesion);
          guardarSesionLocal(sesion);
        }),
        map((respuesta) => respuesta.usuario)
      );
  }

  /**
   * Revalida el token guardado al iniciar la aplicacion.
   */
  async restaurarSesion(): Promise<void> {
    const sesion = leerSesion();

    if (!sesion) {
      this.sesionSignal.set(null);
      return;
    }

    this.sesionSignal.set(sesion);

    await firstValueFrom(
      this.http.get<{ usuario: UsuarioSesion }>(`${API_BASE_URL}/auth/me.php`).pipe(
        tap((respuesta) => {
          const actualizada: SesionGuardada = { ...sesion, usuario: respuesta.usuario };
          this.sesionSignal.set(actualizada);
          guardarSesionLocal(actualizada);
        }),
        catchError(() => {
          this.limpiarSesion();
          return of(null);
        }),
        map(() => undefined)
      )
    );
  }

  logout(): void {
    const token = this.token();

    if (token) {
      this.http
        .post(`${API_BASE_URL}/auth/logout.php`, {})
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    this.limpiarSesion();

    // Recarga completa para no dejar datos del usuario anterior en memoria.
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    } else {
      void this.router.navigate(['/login']);
    }
  }

  cambiarPassword(actual: string, nueva: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(
      `${API_BASE_URL}/auth/cambiar_password.php`,
      { actual, nueva }
    );
  }

  tienePermiso(permiso: string): boolean {
    return tienePermiso(this.usuario(), permiso);
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.rol();
    return rol !== null && roles.includes(rol);
  }

  private limpiarSesion(): void {
    this.sesionSignal.set(null);
    limpiarSesionLocal();
  }
}
