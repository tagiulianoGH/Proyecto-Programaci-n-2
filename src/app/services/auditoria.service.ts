import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { AuditoriaRespuesta } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/auditoria/index.php`;

  getAuditoria(filtros: {
    accion?: string;
    desde?: string;
    limite?: number;
    offset?: number;
  }): Observable<AuditoriaRespuesta> {
    let params = new HttpParams();

    if (filtros.accion) {
      params = params.set('accion', filtros.accion);
    }
    if (filtros.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros.limite !== undefined) {
      params = params.set('limite', filtros.limite);
    }
    if (filtros.offset !== undefined) {
      params = params.set('offset', filtros.offset);
    }

    return this.http.get<AuditoriaRespuesta>(this.apiUrl, { params });
  }
}
