import { InjectionToken, Provider } from '@angular/core';

/** Textos do `EvoPagination`, sobreponíveis por `provideEvoPaginationMessages()`. */
export interface EvoPaginationMessages {
  /** Nome acessível do `<nav>`. */
  readonly label: string;
  readonly previous: string;
  readonly next: string;
  /** Nome acessível de cada botão de página. */
  readonly page: (pagina: number) => string;
  /** Rótulo do selector de linhas por página. */
  readonly pageSize: string;
  /** Resumo "1–10 de 124". `total` é 0 quando não há resultados. */
  readonly summary: (de: number, ate: number, total: number) => string;
}

/** As mensagens por omissão, em português. */
export const EVO_PAGINATION_DEFAULT_MESSAGES: EvoPaginationMessages = {
  label: 'Paginação',
  previous: 'Página anterior',
  next: 'Página seguinte',
  page: (n) => `Página ${n}`,
  pageSize: 'Linhas por página',
  summary: (de, ate, total) =>
    total === 0 ? 'Sem resultados' : `A mostrar ${de}–${ate} de ${total}`,
};

export const EVO_PAGINATION_MESSAGES = new InjectionToken<EvoPaginationMessages>(
  'EVO_PAGINATION_MESSAGES',
  { providedIn: 'root', factory: () => EVO_PAGINATION_DEFAULT_MESSAGES },
);

/**
 * Sobrepõe os textos de todos os `evo-pagination` da aplicação (ou de uma
 * rota/componente, se usado nos seus `providers`). Inclui os da paginação do
 * `evo-data-table`.
 *
 * ```ts
 * provideEvoPaginationMessages({ summary: (de, ate, total) => `${de}-${ate} / ${total}` })
 * ```
 */
export function provideEvoPaginationMessages(mensagens: Partial<EvoPaginationMessages>): Provider {
  return {
    provide: EVO_PAGINATION_MESSAGES,
    useValue: { ...EVO_PAGINATION_DEFAULT_MESSAGES, ...mensagens } satisfies EvoPaginationMessages,
  };
}
