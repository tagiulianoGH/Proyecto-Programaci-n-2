import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Uso: <button *appPermiso="'datos.gestionar'">Editar</button>
 */
@Directive({
  selector: '[appPermiso]',
})
export class TienePermisoDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly appPermiso = input.required<string>();

  constructor() {
    effect(() => {
      const permitido = this.auth.tienePermiso(this.appPermiso());
      this.viewContainer.clear();

      if (permitido) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
