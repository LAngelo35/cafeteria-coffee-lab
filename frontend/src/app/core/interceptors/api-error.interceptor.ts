import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiMessage =
        error.error?.error?.message ||
        error.message ||
        'Error de comunicación con el servidor del Coffee Lab.';

      return throwError(() => ({
        status: error.status,
        message: apiMessage,
        detail: error.error?.error ?? null,
      }));
    }),
  );
