import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';
import { Cliente } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/Get_Clientes.php`;

  // Signal para almacenar todos los clientes en un array
  readonly clientes = signal<Cliente[]>([]);

  /**
   * Obtiene todos los clientes de la base de datos
   * @returns Observable con array de clientes
   */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl).pipe(
      map((clientes) => {
        this.clientes.set(clientes);
        return clientes;
      }),
      catchError((error) => {
        console.error('Error al obtener clientes:', error);
        return of([]);
      })
    );
  }

  /**
   * Carga y almacena todos los clientes en el array interno
   * @returns Array de clientes
   */
  cargarClientes(): Cliente[] {
    this.getClientes().subscribe();
    return this.clientes();
  }

  crearCliente(cliente: Omit<Cliente, 'id'>): Observable<{ ok: boolean; id: number; message: string }> {
    return this.http.post<{ ok: boolean; id: number; message: string }>(
      `${API_BASE_URL}/clientes/guardar.php`,
      cliente
    );
  }

  actualizarCliente(cliente: Cliente): Observable<{ ok: boolean; message: string }> {
    return this.http.put<{ ok: boolean; message: string }>(
      `${API_BASE_URL}/clientes/guardar.php`,
      cliente
    );
  }

  eliminarCliente(id: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${API_BASE_URL}/clientes/guardar.php?id=${id}`
    );
  }
}
