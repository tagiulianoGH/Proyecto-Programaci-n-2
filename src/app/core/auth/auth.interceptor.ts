import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { limpiarSesionLocal, tokenActual } from './sesion.storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = tokenActual();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.includes('/auth/login.php');

      if (error.status === 401 && !esLogin) {
        limpiarSesionLocal();

        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }

      return throwError(() => error);
    })
  );
};
