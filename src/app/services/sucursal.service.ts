import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Sucursal } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SucursalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/Get_Sucursales.php`;

  // Signal para almacenar todas las sucursales en un array
  readonly sucursales = signal<Sucursal[]>([]);

  /**
   * Obtiene todas las sucursales de la base de datos
   * @returns Observable con array de sucursales
   */
  getSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.apiUrl).pipe(
      map((sucursales) => {
        this.sucursales.set(sucursales);
        return sucursales;
      }),
      catchError((error) => {
        console.error('Error al obtener sucursales:', error);
        return of([]);
      })
    );
  }

  /**
   * Carga y almacena todas las sucursales en el array interno
   * @returns Array de sucursales
   */
  cargarSucursales(): Sucursal[] {
    this.getSucursales().subscribe();
    return this.sucursales();
  }

  crearSucursal(
    sucursal: Omit<Sucursal, 'id'>
  ): Observable<{ ok: boolean; id: number; message: string }> {
    return this.http.post<{ ok: boolean; id: number; message: string }>(
      `${API_BASE_URL}/sucursales/guardar.php`,
      sucursal
    );
  }

  actualizarSucursal(sucursal: Sucursal): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(
      `${API_BASE_URL}/sucursales/guardar.php`,
      sucursal
    );
  }

  eliminarSucursal(id: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${API_BASE_URL}/sucursales/guardar.php?id=${id}`
    );
  }
}
