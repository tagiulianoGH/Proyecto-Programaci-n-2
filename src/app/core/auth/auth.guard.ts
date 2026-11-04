import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from '../../models';

export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { redirect: estado.url } });
};

export function roleGuard(roles: Rol[]): CanActivateFn {
  return (_ruta, estado) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.autenticado()) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: estado.url } });
    }

    if (auth.tieneRol(...roles)) {
      return true;
    }

    return router.createUrlTree(['/sin-acceso']);
  };
}
