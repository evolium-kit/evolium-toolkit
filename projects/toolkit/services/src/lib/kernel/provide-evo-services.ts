import {
  EnvironmentProviders,
  Provider,
  Signal,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';
import type { Routes } from '@angular/router';
import { bootstrapEvoPlugins } from './bootstrap';
import { defaultErrorMapper } from './error-mapper';
import { EvoError } from './evo-error';
import { memoryStorage } from './storage';
import {
  EVO_BASE_URL,
  EVO_ERROR_MAPPER,
  EVO_PLUGIN_CONFIG_ENTRY,
  EVO_PLUGINS,
  EVO_STORAGE,
} from './tokens';
import { EvoPlugin, EvoStorage } from './types';

export const enum EvoServiceFeatureKind {
  Plugin,
  BaseUrl,
  Storage,
  ErrorMapper,
}

export interface EvoServiceFeature<K extends EvoServiceFeatureKind = EvoServiceFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
  /** Presente apenas em `withPlugin`, para `evoRoutes()` poder recolher rotas. */
  readonly plugin?: EvoPlugin;
}

/**
 * Configura o kernel de serviços.
 *
 * ```ts
 * provideEvoServices(
 *   withBaseUrl('/api'),
 *   withStorage(cookieStorage()),
 *   withPlugin(authPlugin(), { refreshSkewSeconds: 60 }),
 * )
 * ```
 *
 * Requer `provideHttpClient(withInterceptors([evoDispatchInterceptor]))`.
 */
export function provideEvoServices(
  ...features: readonly EvoServiceFeature[]
): EnvironmentProviders {
  const temPlugins = features.some((f) => f.kind === EvoServiceFeatureKind.Plugin);

  if (isDevMode()) {
    const nomes = features.filter((f) => f.plugin).map((f) => f.plugin!.name);
    const duplicados = nomes.filter((nome, i) => nomes.indexOf(nome) !== i);
    if (duplicados.length > 0) {
      throw new Error(
        `[evo] plugin registado mais do que uma vez: ${[...new Set(duplicados)].join(', ')}.`,
      );
    }
  }

  return makeEnvironmentProviders([
    // Omissões primeiro: as features vêm a seguir e sobrepõem-se.
    { provide: EVO_BASE_URL, useValue: signal('/api') },
    { provide: EVO_ERROR_MAPPER, useValue: defaultErrorMapper },
    { provide: EVO_STORAGE, useFactory: memoryStorage },

    ...features.flatMap((feature) => feature.providers),

    provideEnvironmentInitializer(() => {
      if (!temPlugins) return;
      bootstrapEvoPlugins();
    }),
  ]);
}

/** Regista um plugin, com a sua configuração opcional. */
export function withPlugin<TApi extends object, TConfig>(
  plugin: EvoPlugin<TApi>,
  config?: TConfig,
): EvoServiceFeature<EvoServiceFeatureKind.Plugin> {
  const providers: Provider[] = [
    { provide: EVO_PLUGINS, useValue: plugin, multi: true },
    ...((plugin.providers ?? []) as Provider[]),
  ];

  if (config !== undefined) {
    providers.push({
      provide: EVO_PLUGIN_CONFIG_ENTRY,
      useValue: [plugin.name, config] as const,
      multi: true,
    });
  }

  return { kind: EvoServiceFeatureKind.Plugin, providers, plugin: plugin as EvoPlugin };
}

/** URL base da API. Aceita um signal, para multi-inquilino. */
export function withBaseUrl(
  url: string | Signal<string>,
): EvoServiceFeature<EvoServiceFeatureKind.BaseUrl> {
  const valor = typeof url === 'string' ? signal(url) : url;
  return {
    kind: EvoServiceFeatureKind.BaseUrl,
    providers: [{ provide: EVO_BASE_URL, useValue: valor }],
  };
}

/**
 * Estratégia de armazenamento partilhada pelos plugins.
 *
 * A fábrica é executada em contexto de injecção, o que permite a
 * `cookieStorage()` injectar `REQUEST`/`RESPONSE_INIT` no servidor.
 */
export function withStorage(
  storage: EvoStorage | (() => EvoStorage),
): EvoServiceFeature<EvoServiceFeatureKind.Storage> {
  const provider: Provider =
    typeof storage === 'function'
      ? { provide: EVO_STORAGE, useFactory: storage }
      : { provide: EVO_STORAGE, useValue: storage };

  return { kind: EvoServiceFeatureKind.Storage, providers: [provider] };
}

/** Normalizador de erros global. */
export function withErrorMapper(
  mapper: (erro: unknown) => EvoError,
): EvoServiceFeature<EvoServiceFeatureKind.ErrorMapper> {
  return {
    kind: EvoServiceFeatureKind.ErrorMapper,
    providers: [{ provide: EVO_ERROR_MAPPER, useValue: mapper }],
  };
}

/**
 * Recolhe as rotas contribuídas pelos plugins.
 *
 * É uma função **pura** sobre os mesmos features, e não algo que leia o
 * injector, porque o `Router` é construído antes de os inicializadores
 * correrem: uma recolha dinâmica chegaria sempre tarde. Assim as rotas são
 * estáticas, tree-shakable e funcionam em SSR.
 *
 * ```ts
 * const evoFeatures = [withBaseUrl('/api'), withPlugin(authPlugin())];
 *
 * export const routes: Routes = [...appRoutes, ...evoRoutes(evoFeatures)];
 * export const appConfig = {
 *   providers: [provideRouter(routes), provideEvoServices(...evoFeatures)],
 * };
 * ```
 */
export function evoRoutes(features: readonly EvoServiceFeature[]): Routes {
  return features.flatMap((feature) => feature.plugin?.routes?.() ?? []);
}
