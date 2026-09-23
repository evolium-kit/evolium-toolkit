import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EvoResourceRegistry } from '../../kernel/registry';

/**
 * Exige sessão activa.
 *
 * ```ts
 * { path: 'painel', canActivate: [evoAuthGuard], loadComponent: … }
 * ```
 */
export const evoAuthGuard: CanActivateFn = (_rota, estado) => {
  const auth = inject(EvoResourceRegistry).get('auth');
  if (auth.isAuthenticated()) return true;

  // `createUrlTree` e não `navigate`: devolver a árvore deixa o Router cancelar
  // a navegação em curso e substituí-la, sem uma navegação aninhada.
  return inject(Router).createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: estado.url },
  });
};

/**
 * Exige pelo menos um dos papéis indicados.
 *
 * ```ts
 * { path: 'admin', canActivate: [evoRoleGuard('admin', 'gestor')], … }
 * ```
 */
export function evoRoleGuard(...permitidos: readonly string[]): CanActivateFn {
  return (rota, estado) => {
    const auth = inject(EvoResourceRegistry).get('auth');
    const router = inject(Router);

    // Sem sessão, o problema é de autenticação e não de autorização:
    // mandar para o login é mais útil do que para uma página de "proibido".
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: estado.url },
      });
    }

    const papeis = auth.roles();
    if (permitidos.some((papel) => papeis.includes(papel))) return true;

    void rota;
    return router.createUrlTree(['/403']);
  };
}
