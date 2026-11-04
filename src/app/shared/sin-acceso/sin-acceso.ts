import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-acceso',
  imports: [RouterLink],
  template: `
    <section class="denied">
      <div class="denied-card">
        <div class="denied-icon">🔒</div>
        <h1>Acceso denegado</h1>
        <p>Tu rol no tiene permisos para acceder a esta sección.</p>
        <a routerLink="/home" class="denied-btn">Volver al inicio</a>
      </div>
    </section>
  `,
  styles: `
    .denied {
      min-height: calc(100vh - 140px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .denied-card {
      text-align: center;
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 2.5rem 3rem;
      box-shadow: 0 24px 60px -40px rgba(15, 23, 42, 0.45);
      max-width: 420px;
    }
    .denied-icon {
      font-size: 2.5rem;
    }
    h1 {
      margin: 0.75rem 0 0.35rem;
      font-size: 1.4rem;
      color: #0f172a;
    }
    p {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }
    .denied-btn {
      display: inline-block;
      padding: 0.65rem 1.2rem;
      border-radius: 9px;
      background: #dd0031;
      color: #fff;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.9rem;
    }
  `,
})
export class SinAcceso {}
