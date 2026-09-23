import { isPlatformServer } from '@angular/common';
import { Injector, PLATFORM_ID, Signal, inject, runInInjectionContext } from '@angular/core';
import { EvoEventBusService } from './event-bus';
import { EvoHttp } from './http/evo-http';
import { EvoResourceRegistry } from './registry';
import { sortPlugins } from './sort-plugins';
import {
  EVO_BASE_URL,
  EVO_ERROR_MAPPER,
  EVO_PLUGIN_CONFIG_ENTRY,
  EVO_PLUGINS,
  EVO_STORAGE,
} from './tokens';
import { EvoPluginContext } from './types';

/**
 * Inicializa todos os plugins registados.
 *
 * Corre uma vez, a partir de um `provideEnvironmentInitializer`, e em duas
 * passagens:
 *
 * 1. `setup()` de cada plugin, por ordem topológica de `dependsOn`;
 * 2. `augment()` de cada plugin — só aqui é seguro assumir que qualquer
 *    resource existe, o que é o que torna possível estender um plugin sem fork.
 *
 * Tem de ser chamada dentro de um contexto de injecção.
 */
export function bootstrapEvoPlugins(): void {
  const injector = inject(Injector);
  const registry = inject(EvoResourceRegistry);
  const plugins = sortPlugins(inject(EVO_PLUGINS, { optional: true }) ?? []);

  if (plugins.length === 0) return;

  const baseUrl: Signal<string> = inject(EVO_BASE_URL);
  const mapperGlobal = inject(EVO_ERROR_MAPPER);
  const storage = inject(EVO_STORAGE);
  const events = inject(EvoEventBusService);
  const isServer = isPlatformServer(inject(PLATFORM_ID));

  const configs = new Map<string, unknown>(
    inject(EVO_PLUGIN_CONFIG_ENTRY, { optional: true }) ?? [],
  );

  const contextos = new Map<string, EvoPluginContext>();

  for (const plugin of plugins) {
    const contexto: EvoPluginContext = {
      baseUrl,
      http: new EvoHttp(injector, baseUrl, plugin.name),
      storage,
      events,
      injector,
      isServer,
      config: configs.get(plugin.name),
      resolve: (nome) => registry.get(nome),
      toError: (erro) => plugin.mapError?.(erro) ?? mapperGlobal(erro),
    };

    contextos.set(plugin.name, contexto);

    const api = runInInjectionContext(injector, () => plugin.setup(contexto));
    registry.register(plugin.name, api);
  }

  for (const plugin of plugins) {
    const augment = plugin.augment;
    if (!augment) continue;
    const contexto = contextos.get(plugin.name);
    if (!contexto) continue;
    runInInjectionContext(injector, () => augment(contexto));
  }
}
