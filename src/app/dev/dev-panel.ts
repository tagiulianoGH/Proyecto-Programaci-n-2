import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ConfiguracionItem, SesionActiva } from '../models';
import { DevService } from '../services';

@Component({
  selector: 'app-dev-panel',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './dev-panel.html',
  styleUrl: './dev-panel.css',
})
export class DevPanel implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly devService = inject(DevService);

  readonly sesiones = signal<SesionActiva[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly form = this.fb.nonNullable.group({
    nombreEmpresa: ['GiuliCorp'],
    modoMantenimiento: [false],
    mensajeMantenimiento: [''],
  });

  ngOnInit(): void {
    this.cargarSesiones();
    this.cargarConfiguracion();
  }

  cargarSesiones(): void {
    this.cargando.set(true);
    this.devService.getSesiones().subscribe({
      next: (sesiones) => this.sesiones.set(sesiones),
      error: (error) => {
        this.cargando.set(false);
        this.error.set(error?.error?.message ?? 'No se pudieron cargar las sesiones.');
      },
      complete: () => this.cargando.set(false),
    });
  }

  cargarConfiguracion(): void {
    this.devService.getConfiguracion().subscribe({
      next: (config) => this.aplicarConfiguracion(config),
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo cargar la configuración.');
      },
    });
  }

  revocar(sesion: SesionActiva): void {
    if (!confirm(`¿Revocar la sesión de ${sesion.email}?`)) {
      return;
    }

    this.limpiarMensajes();
    this.devService.revocarSesion(sesion.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Sesión revocada.');
        this.cargarSesiones();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo revocar la sesión.');
      },
    });
  }

  guardarConfiguracion(): void {
    this.limpiarMensajes();
    this.guardando.set(true);

    const valores = this.form.getRawValue();

    this.devService
      .guardarConfiguracion({
        nombreEmpresa: valores.nombreEmpresa.trim(),
        modoMantenimiento: valores.modoMantenimiento ? '1' : '0',
        mensajeMantenimiento: valores.mensajeMantenimiento.trim(),
      })
      .subscribe({
        next: (respuesta) => this.mensaje.set(respuesta.message ?? 'Configuración guardada.'),
        error: (error) => {
          this.error.set(error?.error?.message ?? 'No se pudo guardar la configuración.');
        },
        complete: () => this.guardando.set(false),
      });
  }

  private aplicarConfiguracion(config: ConfiguracionItem[]): void {
    const mapa = new Map(config.map((item) => [item.clave, item.valor]));

    this.form.patchValue({
      nombreEmpresa: mapa.get('nombreEmpresa') ?? 'GiuliCorp',
      modoMantenimiento: mapa.get('modoMantenimiento') === '1',
      mensajeMantenimiento: mapa.get('mensajeMantenimiento') ?? '',
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
