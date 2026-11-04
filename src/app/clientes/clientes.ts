import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../models';
import { ClienteService } from '../services';
import { TienePermisoDirective } from '../core/auth';

const SITUACIONES = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'Consumidor final',
  'No categorizado',
] as const;

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, TienePermisoDirective],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly fb = inject(FormBuilder);

  readonly clients = this.clienteService.clientes;
  readonly total = computed(() => this.clients().length);
  readonly situaciones = SITUACIONES;

  readonly modalAbierto = signal(false);
  readonly editando = signal<Cliente | null>(null);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    situacionFiscal: ['Consumidor final', [Validators.required]],
    dni: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.clienteService.getClientes().subscribe();
  }

  claseSituacion(situacionFiscal: string): string {
    switch (situacionFiscal) {
      case 'Responsable Inscripto':
        return 'responsible';
      case 'Monotributista':
        return 'monotributista';
      case 'Exento':
        return 'exento';
      case 'Consumidor final':
        return 'consumidor';
      default:
        return 'no-categorizado';
    }
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset({
      nombre: '',
      apellido: '',
      situacionFiscal: 'Consumidor final',
      dni: 0,
    });
    this.limpiarMensajes();
    this.modalAbierto.set(true);
  }

  abrirEditar(cliente: Cliente): void {
    this.editando.set(cliente);
    this.form.reset({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      situacionFiscal: cliente.situacionFiscal,
      dni: cliente.dni,
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
      apellido: valores.apellido.trim(),
      situacionFiscal: valores.situacionFiscal as Cliente['situacionFiscal'],
      dni: Number(valores.dni),
    };

    this.guardando.set(true);

    const peticion = this.editando()
      ? this.clienteService.actualizarCliente({ ...payload, id: this.editando()!.id })
      : this.clienteService.crearCliente(payload);

    peticion.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Cliente guardado.');
        this.cerrarModal();
        this.clienteService.getClientes().subscribe();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo guardar el cliente.');
      },
      complete: () => this.guardando.set(false),
    });
  }

  eliminar(cliente: Cliente): void {
    if (!confirm(`¿Eliminar a ${cliente.apellido}, ${cliente.nombre}?`)) {
      return;
    }

    this.limpiarMensajes();
    this.clienteService.eliminarCliente(cliente.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Cliente eliminado.');
        this.clienteService.getClientes().subscribe();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo eliminar el cliente.');
      },
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
