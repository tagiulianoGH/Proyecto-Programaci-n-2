import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  iniciarSesion(): void {
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email.trim(), password).subscribe({
      next: () => {
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        const destino = redirect && redirect.startsWith('/') ? redirect : '/home';
        void this.router.navigateByUrl(destino);
      },
      error: (error) => {
        this.cargando.set(false);

        if (error?.status === 0) {
          this.error.set(
            'No se pudo conectar con el servidor. Verificá que Apache/PHP y MySQL estén iniciados.'
          );
          return;
        }

        this.error.set(error?.error?.message ?? 'No se pudo iniciar sesión.');
      },
      complete: () => this.cargando.set(false),
    });
  }
}
