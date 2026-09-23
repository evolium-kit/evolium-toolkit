import { EvoPlugin } from './types';

/**
 * Ordena os plugins por `dependsOn` (DFS pós-ordem).
 *
 * Lança em ciclo ou dependência em falta, sempre com o caminho completo na
 * mensagem — um ciclo detectado tarde é muito mais caro de diagnosticar.
 */
export function sortPlugins(plugins: readonly EvoPlugin[]): EvoPlugin[] {
  const byName = new Map(plugins.map((plugin) => [plugin.name, plugin]));
  const state = new Map<string, 'visiting' | 'done'>();
  const sorted: EvoPlugin[] = [];

  const visit = (plugin: EvoPlugin, trail: readonly string[]): void => {
    const current = state.get(plugin.name);
    if (current === 'done') return;
    if (current === 'visiting') {
      throw new Error(
        `[evo] ciclo de dependências entre plugins: ${[...trail, plugin.name].join(' -> ')}`,
      );
    }

    state.set(plugin.name, 'visiting');

    for (const dependency of plugin.dependsOn ?? []) {
      const target = byName.get(dependency);
      if (!target) {
        throw new Error(
          `[evo] o plugin "${plugin.name}" depende de "${dependency}", que não foi fornecido. ` +
            `Acrescenta withPlugin(${dependency}Plugin()) em provideEvoServices().`,
        );
      }
      visit(target, [...trail, plugin.name]);
    }

    state.set(plugin.name, 'done');
    sorted.push(plugin);
  };

  for (const plugin of plugins) {
    visit(plugin, []);
  }

  return sorted;
}
