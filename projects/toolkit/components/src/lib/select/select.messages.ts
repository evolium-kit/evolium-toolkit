import { InjectionToken, Provider } from '@angular/core';

/**
 * Textos do `EvoSelect`, sobreponíveis por `provideEvoSelectMessages()`.
 *
 * As mensagens de **erro** não estão aqui: vêm de `EVO_TEXT_FIELD_MESSAGES`,
 * para que `provideEvoTextFieldMessages({ errors })` afine todos os campos
 * da aplicação de uma vez.
 */
export interface EvoSelectMessages {
  readonly placeholder: string;
  readonly searchPlaceholder: string;
  /** Rótulo acessível da caixa de pesquisa. */
  readonly searchLabel: string;
  readonly noResults: string;
  readonly loading: string;
  readonly optional: string;
  readonly clear: string;
  readonly selectAll: string;
  /** Resumo da escolha múltipla quando passa de `maxLabels`. */
  readonly selectedCount: (quantos: number) => string;
}

/** As mensagens por omissão, em português. */
export const EVO_SELECT_DEFAULT_MESSAGES: EvoSelectMessages = {
  placeholder: 'Seleccione…',
  searchPlaceholder: 'Pesquisar…',
  searchLabel: 'Pesquisar opções',
  noResults: 'Nenhuma opção encontrada',
  loading: 'A carregar…',
  optional: '(opcional)',
  clear: 'Limpar',
  selectAll: 'Seleccionar todos',
  selectedCount: (n) => (n === 1 ? '1 seleccionado' : `${n} seleccionados`),
};

export const EVO_SELECT_MESSAGES = new InjectionToken<EvoSelectMessages>('EVO_SELECT_MESSAGES', {
  providedIn: 'root',
  factory: () => EVO_SELECT_DEFAULT_MESSAGES,
});

/**
 * Sobrepõe os textos de todos os `evo-select` da aplicação (ou de uma
 * rota/componente, se usado nos seus `providers`).
 *
 * ```ts
 * provideEvoSelectMessages({ placeholder: 'Escolha…', noResults: 'Sem resultados' })
 * ```
 */
export function provideEvoSelectMessages(mensagens: Partial<EvoSelectMessages>): Provider {
  return {
    provide: EVO_SELECT_MESSAGES,
    useValue: { ...EVO_SELECT_DEFAULT_MESSAGES, ...mensagens } satisfies EvoSelectMessages,
  };
}
