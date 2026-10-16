import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { EvoCrudId, EvoCrudMode, EvoCrudOne } from './crud.types';

/** Opções de `injectCrudPage()`. */
export interface EvoCrudPageOptions {
  /** Parâmetro de rota com o id. Por omissão, `'id'`. */
  readonly param?: string;
}

/** O mínimo que `injectCrudPage()` precisa de um resource. */
export interface EvoCrudOneSource<T> {
  one(id: () => EvoCrudId | null | undefined): EvoCrudOne<T>;
}

/** O que `injectCrudPage()` devolve. */
export interface EvoCrudPage<T> {
  /** Id da rota, reactivo (também ao navegar de `/1/editar` para `/2/editar`). */
  readonly id: Signal<string | null>;
  /** `'create'` sem id, `'update'` com id. */
  readonly mode: Signal<EvoCrudMode>;
  readonly item: Signal<T | null>;
  readonly loading: Signal<boolean>;
  /** Só `true` em `'update'`, depois de carregar e sem registo. */
  readonly notFound: Signal<boolean>;
}

/**
 * Estado de uma página de rota de criar/editar: lê o id da rota, deriva o modo
 * e resolve o registo pelo `one()` do resource.
 *
 * ```ts
 * readonly usuarios = injectCrudResource<Usuario>({ path: '/usuarios', strategy: 'fetch-on-miss' });
 * readonly page = injectCrudPage(this.usuarios);
 * ```
 *
 * O id da rota é uma string; o resource compara-o por texto, por isso encontra
 * entidades com id numérico.
 */
export function injectCrudPage<T>(
  resource: EvoCrudOneSource<T>,
  options: EvoCrudPageOptions = {},
): EvoCrudPage<T> {
  const route = inject(ActivatedRoute);
  const param = options.param ?? 'id';

  const id = toSignal(route.paramMap.pipe(map((p) => p.get(param))), {
    initialValue: route.snapshot.paramMap.get(param),
  });
  const mode = computed<EvoCrudMode>(() => (id() ? 'update' : 'create'));
  const registo = resource.one(() => id());

  return {
    id,
    mode,
    item: registo.item,
    loading: registo.loading,
    notFound: computed(() => mode() === 'update' && !registo.loading() && !registo.item()),
  };
}
