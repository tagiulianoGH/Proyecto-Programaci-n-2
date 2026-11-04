import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { VentaMensual } from '../models';

@Injectable({
  providedIn: 'root',
})
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/Get_Ventas.php`;

  // Agregación mensual por sucursal (facturación con IVA incluido)
  readonly ventas = signal<VentaMensual[]>([]);

  /**
   * Obtiene el total vendido por mes y sucursal (con el IVA incluido).
   * El cálculo se realiza en el backend sobre la tabla factura.
   */
  getVentasMensuales(anio?: number): Observable<VentaMensual[]> {
    const url = anio ? `${this.apiUrl}?anio=${anio}` : this.apiUrl;

    return this.http.get<VentaMensual[]>(url).pipe(
      map((ventas) => {
        this.ventas.set(ventas);
        return ventas;
      }),
      catchError((error) => {
        console.error('Error al obtener ventas:', error);
        return of([]);
      })
    );
  }

  /**
   * Dispara la carga y devuelve el array actual (puede estar vacío si aún no cargó).
   */
  cargarVentas(): VentaMensual[] {
    this.getVentasMensuales().subscribe();
    return this.ventas();
  }
}
