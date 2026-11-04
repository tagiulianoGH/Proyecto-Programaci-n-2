import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MaintenanceService } from './maintenance.service';

/**
 * Bloquea el acceso a rutas protegidas cuando el modo mantenimiento está activo
 * y el usuario no es dev.
 */
export const maintenanceGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const maintenance = inject(MaintenanceService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return true;
  }

  if (auth.esDev()) {
    return true;
  }

  if (maintenance.modoMantenimiento()) {
    return router.createUrlTree(['/sin-acceso']);
  }

  return true;
};
