import { EvoCrudHookContext, EvoCrudHooks } from '../crud.types';

/**
 * Invalida outras `queryKey`s (estatísticas de um painel, notificações…)
 * sempre que o resource muda. O próprio resource já se revalida sozinho.
 *
 * Não usa `inject()`: serve como hook local ou global.
 */
export function crudInvalidate(...queryKeys: readonly string[]): EvoCrudHooks {
  const invalidar = async (ctx: EvoCrudHookContext): Promise<void> => {
    // Esperadas, ao contrário do original: o hook só termina com tudo invalidado.
    await Promise.all(queryKeys.map((k) => ctx.queryClient.invalidateQueries({ queryKey: [k] })));
  };

  return {
    name: 'crud-invalidate',
    afterCreate: invalidar,
    afterUpdate: invalidar,
    afterRemove: invalidar,
  };
}
