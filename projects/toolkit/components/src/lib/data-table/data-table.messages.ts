import { InjectionToken, Provider } from '@angular/core';

/**
 * Textos do `EvoDataTable`, sobreponíveis por `provideEvoDataTableMessages()`.
 *
 * Os da paginação (resumo, "Linhas por página", anterior/seguinte) são do
 * `EvoPagination`: `provideEvoPaginationMessages()`.
 */
export interface EvoDataTableMessages {
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  /** Cabeçalho da coluna de acções. */
  readonly actions: string;
  /** Sem dados nenhuns. */
  readonly empty: string;
  /** Com pesquisa, sem resultados. */
  readonly noResults: (termo: string) => string;
  readonly error: string;
  readonly retry: string;
  readonly loading: string;
  readonly selectRow: string;
  readonly selectPage: string;
  readonly expandRow: string;
  /** Anunciado pelo leitor de ecrã quando os resultados mudam. */
  readonly resultsAnnouncement: (total: number, pagina: number, paginas: number) => string;
}

/** As mensagens por omissão, em português. */
export const EVO_DATA_TABLE_DEFAULT_MESSAGES: EvoDataTableMessages = {
  searchLabel: 'Pesquisar na tabela',
  searchPlaceholder: 'Pesquisar…',
  actions: 'Acções',
  empty: 'Sem registos.',
  noResults: (termo) => `Nenhum resultado para "${termo}".`,
  error: 'Não foi possível carregar os dados.',
  retry: 'Tentar de novo',
  loading: 'A carregar…',
  selectRow: 'Seleccionar linha',
  selectPage: 'Seleccionar todas as linhas da página',
  expandRow: 'Mostrar detalhes',
  resultsAnnouncement: (total, pagina, paginas) =>
    total === 0
      ? 'Sem resultados.'
      : `${total} ${total === 1 ? 'resultado' : 'resultados'}, página ${pagina} de ${paginas}.`,
};

export const EVO_DATA_TABLE_MESSAGES = new InjectionToken<EvoDataTableMessages>(
  'EVO_DATA_TABLE_MESSAGES',
  { providedIn: 'root', factory: () => EVO_DATA_TABLE_DEFAULT_MESSAGES },
);

/**
 * Sobrepõe os textos de todas as `evo-data-table` da aplicação (ou de uma
 * rota/componente, se usado nos seus `providers`).
 *
 * ```ts
 * provideEvoDataTableMessages({ empty: 'Ainda não há facturas.' })
 * ```
 */
export function provideEvoDataTableMessages(mensagens: Partial<EvoDataTableMessages>): Provider {
  return {
    provide: EVO_DATA_TABLE_MESSAGES,
    useValue: { ...EVO_DATA_TABLE_DEFAULT_MESSAGES, ...mensagens } satisfies EvoDataTableMessages,
  };
}
