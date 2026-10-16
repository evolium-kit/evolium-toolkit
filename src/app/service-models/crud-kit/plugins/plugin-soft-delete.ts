import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CrudKitPlugin } from '../crud-kit-plugin.types';

/**
 * Transforma `apagar()` num `PUT { [campo]: false }` em vez de um DELETE real —
 * útil para entidades onde "apagar" significa desativar, não remover.
 *
 * Precisa de ser criado dentro de um contexto de injeção (mesma regra de
 * `pluginToastAutomatico`).
 */
export function pluginSoftDelete(campo = 'ativo'): CrudKitPlugin {
  const http = inject(HttpClient);

  return {
    nome: 'soft-delete',
    antesDeApagar: async (ctx, id) => {
      await firstValueFrom(http.put(`${ctx.recurso}/${id}`, { [campo]: false }));
      return false; // cancela o DELETE real — o soft-delete já foi feito acima
    },
  };
}
