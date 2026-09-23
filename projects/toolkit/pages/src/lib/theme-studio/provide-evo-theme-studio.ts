import {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { ROUTES, Router, Routes } from '@angular/router';

export interface EvoThemeStudioConfig {
  /** Caminho da rota, sem barra inicial. Omissão: `_evo/theme`. */
  readonly path?: string;
  readonly title?: string;
  /** Registar apenas em desenvolvimento. Omissão: `true`. */
  readonly onlyInDevMode?: boolean;
}

export const EVO_THEME_STUDIO_CONFIG = new InjectionToken<Required<EvoThemeStudioConfig>>(
  'EVO_THEME_STUDIO_CONFIG',
);

/**
 * Rotas do Theme Studio, para quem preferir registá-las à mão em `app.routes.ts`.
 */
export function evoThemeStudioRoutes(path = '_evo/theme'): Routes {
  return [
    {
      path,
      title: 'Evolium Theme Studio',
      loadComponent: () => import('./theme-studio-page').then((m) => m.EvoThemeStudioPage),
      data: { evoThemeStudio: true },
    },
  ];
}

/**
 * Regista a rota do Theme Studio.
 *
 * Angular não permite a um pacote registar rotas sozinho — não há descoberta
 * automática de providers. O mais perto que se chega é reduzir tudo a uma
 * chamada, e é isso que esta função faz, usando o multi-provider `ROUTES`, o
 * mesmo mecanismo que o `provideRouter` usa internamente.
 *
 * **A ordem importa.** As rotas são recolhidas pela ordem em que os providers
 * são declarados, por isso isto tem de vir **antes** de `provideRouter()`: se
 * vier depois e a aplicação tiver uma rota `**`, o wildcard apanha primeiro e o
 * Studio fica inacessível. Em desenvolvimento, `assertRouteReachable` detecta
 * essa situação e avisa na consola.
 *
 * ```ts
 * providers: [
 *   ...(isDevMode() ? [provideEvoThemeStudio()] : []),
 *   provideRouter(routes),
 * ]
 * ```
 */
export function provideEvoThemeStudio(config: EvoThemeStudioConfig = {}): EnvironmentProviders {
  const path = config.path ?? '_evo/theme';
  const title = config.title ?? 'Theme Studio';
  const activo = config.onlyInDevMode === false || isDevMode();

  const providers: (Provider | EnvironmentProviders)[] = [
    {
      provide: EVO_THEME_STUDIO_CONFIG,
      useValue: { path, title, onlyInDevMode: config.onlyInDevMode ?? true },
    },
  ];

  if (activo) {
    providers.push(
      { provide: ROUTES, multi: true, useValue: evoThemeStudioRoutes(path) },
      provideEnvironmentInitializer(() => assertRouteReachable(path)),
    );
  }

  return makeEnvironmentProviders(providers);
}

/** Diagnóstico de desenvolvimento: detecta um wildcard que sombreie o Studio. */
function assertRouteReachable(path: string): void {
  if (!isDevMode()) return;

  const router = inject(Router, { optional: true });
  if (!router) {
    console.warn(
      '[evo] provideEvoThemeStudio() foi chamado sem Router. Acrescenta provideRouter().',
    );
    return;
  }

  const config = router.config;
  const studio = config.findIndex((rota) => rota.data?.['evoThemeStudio'] === true);
  const wildcard = config.findIndex((rota) => rota.path === '**');

  if (studio === -1) {
    console.warn('[evo] A rota do Theme Studio não chegou ao Router.');
  } else if (wildcard !== -1 && wildcard < studio) {
    console.warn(
      `[evo] A rota "**" (índice ${wildcard}) sombreia /${path} (índice ${studio}). ` +
        'Coloca provideEvoThemeStudio() ANTES de provideRouter() em app.config.ts.',
    );
  }
}
