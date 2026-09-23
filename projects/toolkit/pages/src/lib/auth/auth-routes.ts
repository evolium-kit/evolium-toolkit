import { Routes } from '@angular/router';

export interface EvoAuthRoutesOptions {
  /** Prefixo das rotas. Omissão: `auth`. Vazio monta-as na raiz. */
  readonly prefix?: string;
  /** Para onde ir depois de entrar ou criar conta. Omissão: `/`. */
  readonly redirectTo?: string;
}

/**
 * Rotas das páginas de autenticação.
 *
 * Vive em `/pages` e não no plugin de auth de propósito: `/pages` depende de
 * `/services` para consumir o resource `auth`, portanto o plugin não pode
 * referenciar as páginas sem criar uma dependência circular entre entry points.
 * A camada de cima é que compõe.
 *
 * ```ts
 * export const routes: Routes = [
 *   ...evoAuthRoutes({ redirectTo: '/painel' }),
 *   { path: 'painel', canActivate: [evoAuthGuard], loadComponent: … },
 *   { path: '**', loadComponent: () => import('@evolium-kit/toolkit/pages').then(m => m.EvoNotFoundPage) },
 * ];
 *
 * provideRouter(routes, withComponentInputBinding())
 * ```
 *
 * **`withComponentInputBinding()` é obrigatório.** As opções são entregues às
 * páginas pelo `data` da rota, e é essa feature que o liga aos `input()` dos
 * componentes. Sem ela as páginas usam os valores por omissão em silêncio.
 *
 * Todas usam `loadComponent`, pelo que só entram no bundle de quem lá chegue.
 */
export function evoAuthRoutes(options: EvoAuthRoutesOptions = {}): Routes {
  const prefixo = options.prefix ?? 'auth';
  const base = prefixo ? `${prefixo}/` : '';
  const redirectTo = options.redirectTo ?? '/';

  const caminhos = {
    login: `/${base}login`,
    registar: `/${base}registar`,
    recuperar: `/${base}recuperar`,
  };

  return [
    {
      path: `${base}login`,
      title: 'Entrar',
      loadComponent: () => import('./login-page').then((m) => m.EvoLoginPage),
      data: {
        redirectTo,
        registerLink: caminhos.registar,
        forgotLink: caminhos.recuperar,
      },
    },
    {
      path: `${base}registar`,
      title: 'Criar conta',
      loadComponent: () => import('./register-page').then((m) => m.EvoRegisterPage),
      data: { redirectTo, loginLink: caminhos.login },
    },
    {
      path: `${base}recuperar`,
      title: 'Recuperar senha',
      loadComponent: () => import('./forgot-password-page').then((m) => m.EvoForgotPasswordPage),
      data: { loginLink: caminhos.login },
    },
  ];
}
