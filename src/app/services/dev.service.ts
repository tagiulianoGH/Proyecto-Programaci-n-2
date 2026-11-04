import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { ConfiguracionItem, SesionActiva } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DevService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/dev`;

  getSesiones(): Observable<SesionActiva[]> {
    return this.http.get<SesionActiva[]>(`${this.baseUrl}/sesiones.php`);
  }

  revocarSesion(id: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${this.baseUrl}/sesiones.php?id=${encodeURIComponent(id)}`
    );
  }

  getConfiguracion(): Observable<ConfiguracionItem[]> {
    return this.http.get<ConfiguracionItem[]>(`${this.baseUrl}/config.php`);
  }

  guardarConfiguracion(config: Record<string, string>): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(`${this.baseUrl}/config.php`, config);
  }
}
