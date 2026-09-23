import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { EvoAuth } from './auth.plugin';

/**
 * Acrescenta o Bearer e renova a sessão uma vez em caso de 401.
 *
 * Registado como `sharedInterceptors`, pelo que corre em pedidos de **todos**
 * os plugins — é isso que torna a autenticação central útil. Os endpoints
 * marcados `anonymous`, incluindo o próprio refresh, não passam por aqui, o que
 * é o que impede o ciclo infinito de renovação.
 */
export const authBearerInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(EvoAuth, { optional: true });
  const token = auth?.accessToken();

  const pedido = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(pedido).pipe(
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse) || erro.status !== 401 || !auth) {
        return throwError(() => erro);
      }

      return from(auth.refreshToken()).pipe(
        switchMap((utilizador) => {
          const novo = auth.accessToken();
          // Renovação falhada: propaga o 401 original, que é mais informativo
          // do que um erro sobre a renovação.
          if (!utilizador || !novo) return throwError(() => erro);

          return next(req.clone({ setHeaders: { Authorization: `Bearer ${novo}` } }));
        }),
      );
    }),
  );
};
