import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { FacturaFiltros, FacturaListado, FacturaPayload } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FacturaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/facturas`;

  /** Listado paginado con filtros. El backend limita a los empleados a su sucursal. */
  listar(filtros: FacturaFiltros = {}): Observable<FacturaListado> {
    let params = new HttpParams();

    if (filtros.limite) {
      params = params.set('limite', filtros.limite);
    }
    if (filtros.offset) {
      params = params.set('offset', filtros.offset);
    }
    if (filtros.q?.trim()) {
      params = params.set('q', filtros.q.trim());
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.idSucursal) {
      params = params.set('idSucursal', filtros.idSucursal);
    }
    if (filtros.desde) {
      params = params.set('desde', filtros.desde);
    }
    if (filtros.hasta) {
      params = params.set('hasta', filtros.hasta);
    }

    return this.http.get<FacturaListado>(`${this.apiUrl}/index.php`, { params });
  }

  crear(factura: FacturaPayload): Observable<{ ok: boolean; nroFactura: number; message: string }> {
    return this.http.post<{ ok: boolean; nroFactura: number; message: string }>(
      `${this.apiUrl}/guardar.php`,
      factura
    );
  }

  actualizar(factura: FacturaPayload): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(
      `${this.apiUrl}/guardar.php`,
      factura
    );
  }

  eliminar(nroFactura: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${this.apiUrl}/guardar.php?nroFactura=${nroFactura}`
    );
  }
}
