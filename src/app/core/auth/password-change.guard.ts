import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Redirige a /perfil si el usuario debe cambiar su contraseña (primer ingreso)
 * y está intentando acceder a una ruta distinta a perfil o login.
 */
export const passwordChangeGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return true;
  }

  if (auth.debeCambiarPassword() && estado.url !== '/perfil') {
    return router.createUrlTree(['/perfil']);
  }

  return true;
};
