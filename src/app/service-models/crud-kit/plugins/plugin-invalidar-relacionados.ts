import type { CrudKitPlugin, CrudPluginContext } from '../crud-kit-plugin.types';

/**
 * Invalida outras `queryKeys` (ex.: estatísticas de um dashboard) sempre que este
 * recurso muda — além da invalidação do próprio recurso, que `createCrudResource` já
 * faz sozinho em `onSuccess`.
 *
 * Não usa `inject()` — pode ser instanciado tanto localmente quanto numa fábrica global.
 */
export function pluginInvalidarRelacionados(...queryKeys: string[]): CrudKitPlugin {
  const invalidarTodas = (ctx: CrudPluginContext) =>
    queryKeys.forEach((k) => ctx.queryClient.invalidateQueries({ queryKey: [k] }));

  return {
    nome: 'invalidar-relacionados',
    depoisDeSalvar: invalidarTodas,
    depoisDeAtualizar: invalidarTodas,
    depoisDeApagar: invalidarTodas,
  };
}
