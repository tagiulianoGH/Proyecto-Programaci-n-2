import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sucursal } from '../models';
import { SucursalService } from '../services';
import { TienePermisoDirective } from '../core/auth';

@Component({
  selector: 'app-sucursales',
  imports: [ReactiveFormsModule, TienePermisoDirective],
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.css',
})
export class Sucursales implements OnInit {
  private readonly sucursalService = inject(SucursalService);
  private readonly fb = inject(FormBuilder);

  readonly suc = this.sucursalService.sucursales;
  readonly total = computed(() => this.suc().length);
  readonly totalEmpleados = computed(() =>
    this.suc().reduce((total, sucursal) => total + sucursal.cantEmpleados, 0)
  );

  readonly modalAbierto = signal(false);
  readonly editando = signal<Sucursal | null>(null);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    ciudad: ['', [Validators.required]],
    direccion: ['', [Validators.required]],
    cantEmpleados: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.sucursalService.getSucursales().subscribe();
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', ciudad: '', direccion: '', cantEmpleados: 0 });
    this.limpiarMensajes();
    this.modalAbierto.set(true);
  }

  abrirEditar(sucursal: Sucursal): void {
    this.editando.set(sucursal);
    this.form.reset({
      nombre: sucursal.nombre,
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      cantEmpleados: sucursal.cantEmpleados,
    });
    this.limpiarMensajes();
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    this.limpiarMensajes();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const payload = {
      nombre: valores.nombre.trim(),
      ciudad: valores.ciudad.trim(),
      direccion: valores.direccion.trim(),
      cantEmpleados: Number(valores.cantEmpleados),
    };

    this.guardando.set(true);

    const peticion = this.editando()
      ? this.sucursalService.actualizarSucursal({ ...payload, id: this.editando()!.id })
      : this.sucursalService.crearSucursal(payload);

    peticion.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Sucursal guardada.');
        this.cerrarModal();
        this.sucursalService.getSucursales().subscribe();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo guardar la sucursal.');
      },
      complete: () => this.guardando.set(false),
    });
  }

  eliminar(sucursal: Sucursal): void {
    if (!confirm(`¿Eliminar la ${sucursal.nombre}?`)) {
      return;
    }

    this.limpiarMensajes();
    this.sucursalService.eliminarSucursal(sucursal.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Sucursal eliminada.');
        this.sucursalService.getSucursales().subscribe();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo eliminar la sucursal.');
      },
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
