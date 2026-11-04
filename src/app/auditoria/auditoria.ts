import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditoriaItem } from '../models';
import { AuditoriaService } from '../services';

@Component({
  selector: 'app-auditoria',
  imports: [DatePipe],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class Auditoria implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);

  readonly items = signal<AuditoriaItem[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly accion = signal('');
  readonly desde = signal('');
  readonly limite = 50;
  readonly offset = signal(0);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.auditoriaService
      .getAuditoria({
        accion: this.accion().trim() || undefined,
        desde: this.desde() || undefined,
        limite: this.limite,
        offset: this.offset(),
      })
      .subscribe({
        next: (respuesta) => {
          this.items.set(respuesta.items);
          this.total.set(respuesta.total);
        },
        error: (error) => {
          this.cargando.set(false);
          this.error.set(error?.error?.message ?? 'No se pudo cargar la auditoría.');
        },
        complete: () => this.cargando.set(false),
      });
  }

  filtrar(): void {
    this.offset.set(0);
    this.cargar();
  }

  limpiar(): void {
    this.accion.set('');
    this.desde.set('');
    this.offset.set(0);
    this.cargar();
  }

  anterior(): void {
    if (this.offset() === 0) {
      return;
    }
    this.offset.set(Math.max(0, this.offset() - this.limite));
    this.cargar();
  }

  siguiente(): void {
    if (this.offset() + this.limite >= this.total()) {
      return;
    }
    this.offset.set(this.offset() + this.limite);
    this.cargar();
  }

  claseAccion(accion: string): string {
    if (accion.startsWith('login')) {
      return 'accion-login';
    }
    if (accion.startsWith('usuario') || accion.startsWith('dev')) {
      return 'accion-admin';
    }
    if (accion.startsWith('password')) {
      return 'accion-seguridad';
    }
    return 'accion-datos';
  }

  detalle(item: AuditoriaItem): string {
    if (!item.detalle) {
      return '—';
    }

    return Object.entries(item.detalle)
      .map(([clave, valor]) => `${clave}: ${String(valor)}`)
      .join(' · ');
  }
}
