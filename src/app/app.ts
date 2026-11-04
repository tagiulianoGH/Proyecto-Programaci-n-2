import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Footer } from './footer/footer';
import { AuthService, ETIQUETAS_ROL } from './core/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);

  protected readonly etiquetaRol = computed(() => {
    const rol = this.auth.rol();
    return rol ? ETIQUETAS_ROL[rol] : '';
  });

  protected salir(): void {
    this.auth.logout();
  }
}
