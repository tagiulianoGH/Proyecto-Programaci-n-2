import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Rol, UsuarioAdmin, UsuarioPayload } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/usuarios`;

  getUsuarios(busqueda = ''): Observable<UsuarioAdmin[]> {
    let params = new HttpParams();
    if (busqueda.trim() !== '') {
      params = params.set('q', busqueda.trim());
    }

    return this.http.get<UsuarioAdmin[]>(`${this.apiUrl}/index.php`, { params });
  }

  crear(payload: UsuarioPayload): Observable<{ ok: boolean; id: number; message: string }> {
    return this.http.post<{ ok: boolean; id: number; message: string }>(
      `${this.apiUrl}/guardar.php`,
      payload
    );
  }

  actualizar(payload: UsuarioPayload): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(`${this.apiUrl}/guardar.php`, payload);
  }

  resetPassword(
    idUsuario: number,
    nuevaPassword = ''
  ): Observable<{ ok: boolean; passwordTemporal: string | null; message: string }> {
    return this.http.post<{ ok: boolean; passwordTemporal: string | null; message: string }>(
      `${this.apiUrl}/reset_password.php`,
      { idUsuario, nuevaPassword }
    );
  }

  cambiarRol(
    idUsuario: number,
    rol: Rol,
    idSucursal: number | null = null
  ): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${this.apiUrl}/cambiar_rol.php`, {
      idUsuario,
      rol,
      idSucursal,
    });
  }
}
