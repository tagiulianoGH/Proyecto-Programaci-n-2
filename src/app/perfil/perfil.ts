import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, ETIQUETAS_ROL } from '../core/auth';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  readonly cargando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    actual: ['', [Validators.required]],
    nueva: ['', [Validators.required, Validators.minLength(8)]],
    repetir: ['', [Validators.required]],
  });

  etiquetaRol(): string {
    const rol = this.auth.rol();
    return rol ? ETIQUETAS_ROL[rol] : '';
  }

  cambiarPassword(): void {
    this.mensaje.set('');
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { actual, nueva, repetir } = this.form.getRawValue();

    if (nueva !== repetir) {
      this.error.set('La nueva contraseña y su repetición no coinciden.');
      return;
    }

    this.cargando.set(true);

    this.auth.cambiarPassword(actual, nueva).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message ?? 'Contraseña actualizada.');
        this.form.reset();
      },
      error: (error) => {
        this.error.set(error?.error?.message ?? 'No se pudo cambiar la contraseña.');
      },
      complete: () => this.cargando.set(false),
    });
  }
}
