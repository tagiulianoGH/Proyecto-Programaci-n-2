import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DevService } from '../../services';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private readonly dev = inject(DevService);

  readonly modoMantenimiento = signal(false);
  readonly cargando = signal(true);

  cargar(): Promise<void> {
    return firstValueFrom(this.dev.getConfiguracion())
      .then((config) => {
        const mapa = new Map(config.map((item) => [item.clave, item.valor]));
        this.modoMantenimiento.set(mapa.get('modoMantenimiento') === '1');
      })
      .catch(() => {
        // Si no se puede leer la configuración, se asume que no hay mantenimiento.
        this.modoMantenimiento.set(false);
      })
      .finally(() => {
        this.cargando.set(false);
      });
  }
}
