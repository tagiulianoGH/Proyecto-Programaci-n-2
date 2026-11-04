import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstadoFactura, FacturaFiltros, FacturaListadoItem, FacturaPayload } from '../models';
import { AuthService, TienePermisoDirective } from '../core/auth';
import { ClienteService, FacturaService, SucursalService } from '../services';

const ESTADOS: EstadoFactura[] = ['Pendiente', 'Activo', 'Atrasado'];

@Component({
  selector: 'app-facturas',
  imports: [ReactiveFormsModule, TienePermisoDirective, CurrencyPipe, DatePipe],
  templateUrl: './facturas.html',
  styleUrl: './facturas.css',
})
export class Facturas implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facturaService = inject(FacturaService);
  private readonly clienteService = inject(ClienteService);
  private readonly sucursalService = inject(SucursalService);
  protected readonly auth = inject(AuthService);

  readonly estados = ESTADOS;
  readonly clientes = this.clienteService.clientes;
  readonly sucursales = this.sucursalService.sucursales;

  readonly items = signal<FacturaListadoItem[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly offset = signal(0);
  private readonly filtrosActivos = signal<Omit<FacturaFiltros, 'offset'>>({
    limite: 20,
    q: '',
    estado: '',
    idSucursal: null,
    desde: '',
    hasta: '',
  });

  readonly limiteActual = computed(() => this.filtrosActivos().limite ?? 20);
  readonly paginaActual = computed(
    () => Math.floor(this.offset() / this.limiteActual()) + 1
  );
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limiteActual()))
  );
  readonly rangoInicio = computed(() => (this.total() === 0 ? 0 : this.offset() + 1));
  readonly rangoFin = computed(() =>
    Math.min(this.offset() + this.limiteActual(), this.total())
  );

  readonly nuevo = computed(() => this.auth.tienePermiso('datos.gestionar'));

  readonly filtrosForm = this.fb.nonNullable.group({
    q: [''],
    estado: ['' as EstadoFactura | ''],
    idSucursal: [null as number | null],
    desde: [''],
    hasta: [''],
    limite: [20],
  });

  readonly modalAbierto = signal(false);
  readonly editando = signal<FacturaListadoItem | null>(null);

  readonly form = this.fb.nonNullable.group({
    fechaFactura: ['', [Validators.required]],
    idCliente: [0, [Validators.required, Validators.min(1)]],
    idSucursal: [0, [Validators.required, Validators.min(1)]],
    importe: [0, [Validators.required, Validators.min(0.01)]],
    estado: ['Pendiente' as EstadoFactura, [Validators.required]],
  });

  ngOnInit(): void {
    this.clienteService.getClientes().subscribe();
    this.sucursalService.getSucursales().subscribe();
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.facturaService
      .listar({ ...this.filtrosActivos(), offset: this.offset() })
      .subscribe({
        next: (listado) => {
          this.items.set(listado.items);
          this.total.set(listado.total);
        },
        error: (error) => {
          this.items.set([]);
          this.total.set(0);
          this.error.set(error?.error?.message ?? 'No se pudieron cargar las facturas.');
        },
        complete: () => this.cargando.set(false),
      });
  }

  aplicarFiltros(): void {
    const valores = this.filtrosForm.getRawValue();
    this.filtrosActivos.set({
      limite: Number(valores.limite) || 20,
      q: valores.q,
      estado: valores.estado,
      idSucursal: valores.idSucursal,
      desde: valores.desde,
      hasta: valores.hasta,
    });
    this.offset.set(0);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      q: '',
      estado: '',
      idSucursal: null,
      desde: '',
      hasta: '',
      limite: 20,
    });
    this.filtrosActivos.set({
      limite: 20,
      q: '',
      estado: '',
      idSucursal: null,
      desde: '',
      hasta: '',
    });
    this.offset.set(0);
    this.cargar();
  }

  irPagina(pagina: number): void {
    const destino = Math.min(Math.max(1, pagina), this.totalPaginas());
    this.offset.set((destino - 1) * this.limiteActual());
    this.cargar();
  }

  totalFila(item: FacturaListadoItem): number {
    return item.importe + item.iva;
  }

  claseEstado(estado: EstadoFactura): string {
    return estado.toLowerCase();
  }

  nombreCliente(item: FacturaListadoItem): string {
    return `${item.clienteApellido}, ${item.clienteNombre}`;
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset({
      fechaFactura: this.hoyLocal(),
      idCliente: 0,
      idSucursal: this.auth.usuario()?.idSucursal ?? 0,
      importe: 0,
      estado: 'Pendiente',
    });
    this.limpiarMensajes();
    this.modalAbierto.set(true);
  }

  abrirEditar(item: FacturaListadoItem): void {
    this.editando.set(item);
    this.form.reset({
      fechaFactura: item.fechaFactura.slice(0, 10),
      idCliente: item.idCliente,
      idSucursal: item.idSucursal,
      importe: item.importe,
      estado: item.estado,
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
    const payload: FacturaPayload = {
      fechaFactura: valores.fechaFactura,
      idCliente: Number(valores.idCliente),
      idSucursal: Number(valores.idSucursal),
      importe: Number(valores.importe),
      estado: valores.estado,
    };

    this.guardando.set(true);

    const peticion = this.editando()
      ? this.facturaService.actualizar({
          ...payload,
          nroFactura: this.editando()!.nroFactura,
        })
      : this.facturaService.crear(payload);

    peticion.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Factura guardada.');
        this.cerrarModal();
        this.cargar();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo guardar la factura.');
      },
      complete: () => this.guardando.set(false),
    });
  }

  eliminar(item: FacturaListadoItem): void {
    if (!confirm(`¿Eliminar la factura #${item.nroFactura} de ${this.nombreCliente(item)}?`)) {
      return;
    }

    this.limpiarMensajes();
    this.facturaService.eliminar(item.nroFactura).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Factura eliminada.');
        this.cargar();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo eliminar la factura.');
      },
    });
  }

  private hoyLocal(): string {
    const hoy = new Date();
    const pad = (valor: number) => String(valor).padStart(2, '0');
    return `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
