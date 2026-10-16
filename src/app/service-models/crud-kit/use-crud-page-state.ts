import { computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { CrudMode, ID } from './crud-kit.types';

export interface CrudPageStateOptions {
  /** Nome do parâmetro de rota que contém o id. Default: 'id'. */
  paramName?: string;
}

/**
 * Shape estrutural mínimo exigido de um resource — não importa o tipo completo de
 * retorno de `createCrudResource` para evitar acoplamento circular. O objeto retornado
 * por `createCrudResource` já satisfaz este shape.
 */
export interface CrudResourceLike<TEntity> {
  pegarUmQuery: (idSignal: () => ID | null) => {
    data: Signal<TEntity | null>;
    isLoading: Signal<boolean>;
  };
}

/**
 * Camada 4 do `crud-kit`: estado de uma página de rota (criar/editar) — leitura reativa
 * do `id` da rota, `mode` derivado automaticamente, e a query individual já resolvida.
 * Elimina o boilerplate repetido de `route.snapshot.paramMap.get('id')` +
 * `signal<'criar' | 'atualizar'>` manual em cada página de entidade.
 *
 * Usa `inject()` internamente — só pode ser chamada dentro de um contexto de injeção
 * (campo de classe de componente, ou construtor).
 */
export function useCrudPageState<TEntity extends Record<string, any>>(
  resource: CrudResourceLike<TEntity>,
  options?: CrudPageStateOptions,
) {
  const route = inject(ActivatedRoute);
  const paramName = options?.paramName ?? 'id';

  // `toSignal` (não só `snapshot`) para reagir também quando o parâmetro muda sem
  // recriar o componente (ex: navegar de /usuarios/1/editar para /usuarios/2/editar).
  const id = toSignal(route.paramMap.pipe(map((p) => p.get(paramName))), {
    initialValue: route.snapshot.paramMap.get(paramName),
  });

  const mode = computed<CrudMode>(() => (id() ? 'atualizar' : 'criar'));

  const query = resource.pegarUmQuery(() => id());

  // Só faz sentido em modo 'atualizar' — em 'criar' simplesmente ainda não há dado.
  const naoEncontrado = computed(() => mode() === 'atualizar' && !query.isLoading() && !query.data());

  return {
    id,
    mode,
    dado: query.data,
    isLoading: query.isLoading,
    naoEncontrado,
  };
}
