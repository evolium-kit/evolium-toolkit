import { EvoCrudHooks } from '../crud.types';

/**
 * Troca o DELETE por um `PATCH urls.update(id)` com `{ [field]: false }` —
 * para entidades em que apagar é desactivar.
 *
 * Usa os `urls` do resource e o cliente do kernel (`baseUrl`, Bearer); no
 * original o URL era montado à mão e ignorava ambos. Devolve `'handled'`, por
 * isso a lista revalida e o `afterRemove` (avisos, invalidações) corre.
 */
export function crudSoftDelete(field = 'ativo'): EvoCrudHooks {
  return {
    name: 'crud-soft-delete',
    beforeRemove: async (ctx, id) => {
      await ctx.request('PATCH', ctx.urls.update(id), { [field]: false });
      return 'handled' as const;
    },
  };
}
