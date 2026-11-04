import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Rol, UsuarioAdmin, UsuarioPayload } from '../models';
import { AuthService, ETIQUETAS_ROL } from '../core/auth';
import { SucursalService, UsuarioService } from '../services';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly sucursalService = inject(SucursalService);
  protected readonly auth = inject(AuthService);

  readonly usuarios = signal<UsuarioAdmin[]>([]);
  readonly sucursales = this.sucursalService.sucursales;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly busqueda = signal('');

  readonly modalAbierto = signal(false);
  readonly editando = signal<UsuarioAdmin | null>(null);

  readonly rolesDisponibles = computed<Rol[]>(() =>
    this.auth.esDev() ? ['empleado', 'admin', 'dev'] : ['empleado']
  );

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (texto === '') {
      return this.usuarios();
    }

    return this.usuarios().filter((usuario) =>
      `${usuario.nombre} ${usuario.apellido} ${usuario.email}`.toLowerCase().includes(texto)
    );
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rol: ['empleado' as Rol, [Validators.required]],
    idSucursal: [null as number | null],
    activo: [true],
  });

  ngOnInit(): void {
    this.cargarUsuarios();
    this.sucursalService.getSucursales().subscribe();
  }

  etiquetaRol(rol: Rol): string {
    return ETIQUETAS_ROL[rol] ?? rol;
  }

  buscar(valor: string): void {
    this.busqueda.set(valor);
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set('');

    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: (error) => {
        this.cargando.set(false);
        this.error.set(error?.error?.message ?? 'No se pudieron cargar los usuarios.');
      },
      complete: () => this.cargando.set(false),
    });
  }

  abrirNuevo(): void {
    this.editando.set(null);
    this.form.reset({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      rol: 'empleado',
      idSucursal: null,
      activo: true,
    });
    this.limpiarMensajes();
    this.modalAbierto.set(true);
  }

  abrirEditar(usuario: UsuarioAdmin): void {
    this.editando.set(usuario);
    this.form.reset({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      idSucursal: usuario.idSucursal,
      activo: usuario.activo,
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
    const esEdicion = this.editando() !== null;
    const password = valores.password.trim();

    if (!esEdicion && password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (esEdicion && password !== '' && password.length < 8) {
      this.error.set('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (valores.rol === 'empleado' && !valores.idSucursal) {
      this.error.set('Un usuario empleado debe tener una sucursal asignada.');
      return;
    }

    const payload: UsuarioPayload = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      email: valores.email.trim().toLowerCase(),
      rol: valores.rol,
      idSucursal: valores.rol === 'empleado' ? valores.idSucursal : null,
      activo: valores.activo,
    };

    if (password !== '') {
      payload.password = password;
    }

    this.guardando.set(true);

    const peticion: Observable<{ ok: boolean; message: string }> = esEdicion
      ? this.usuarioService.actualizar({ ...payload, id: this.editando()!.id })
      : this.usuarioService.crear(payload);

    peticion.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Usuario guardado.');
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo guardar el usuario.');
      },
      complete: () => this.guardando.set(false),
    });
  }

  alternarActivo(usuario: UsuarioAdmin): void {
    const accion = usuario.activo ? 'desactivar' : 'activar';

    if (!confirm(`¿Seguro que querés ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    this.limpiarMensajes();
    this.usuarioService
      .actualizar({
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        idSucursal: usuario.idSucursal,
        activo: !usuario.activo,
      })
      .subscribe({
        next: () => {
          this.mensaje.set(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente.`);
          this.cargarUsuarios();
        },
        error: (error) => {
          this.error.set(error?.error?.message ?? 'No se pudo actualizar el usuario.');
        },
      });
  }

  resetearPassword(usuario: UsuarioAdmin): void {
    if (!confirm(`¿Restablecer la contraseña de ${usuario.email}? Se cerrarán sus sesiones.`)) {
      return;
    }

    this.limpiarMensajes();
    this.usuarioService.resetPassword(usuario.id).subscribe({
      next: (respuesta) => {
        const temporal = respuesta.passwordTemporal
          ? ` Contraseña temporal: ${respuesta.passwordTemporal}`
          : '';
        this.mensaje.set((respuesta.message ?? 'Contraseña restablecida.') + temporal);
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo restablecer la contraseña.');
      },
    });
  }

  /** Abre el modal dedicado para cambiar el rol de un usuario (solo dev). */
  cambiarRol(usuario: UsuarioAdmin): void {
    if (!this.auth.esDev()) {
      return;
    }

    this.editando.set(usuario);
    this.form.reset({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      idSucursal: usuario.idSucursal,
      activo: usuario.activo,
    });
    this.limpiarMensajes();
    this.modalAbierto.set(true);
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.mensaje.set('');
  }
}
