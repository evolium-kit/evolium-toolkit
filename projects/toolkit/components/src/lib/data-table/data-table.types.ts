import type { Observable } from 'rxjs';

/* eslint-disable @typescript-eslint/ban-types */

/** Chave de coluna: as do tipo da linha, com autocompletar, ou qualquer outra (colunas calculadas). */
export type EvoDataTableKey<T> = Extract<keyof T, string> | (string & {});

/** Sentido de uma ordenação. */
export type EvoSortDirection = 'asc' | 'desc';

/** Ordenação activa: a coluna (`key`) e o sentido. `null` é "sem ordenação". */
export interface EvoDataTableSort {
  readonly key: string;
  readonly direction: EvoSortDirection;
}

/** Como os dados são paginados, filtrados e ordenados. */
export type EvoDataTablePaging = 'client' | 'server';

/** Uma coluna da tabela. */
export interface EvoDataTableColumn<T> {
  /** Campo da linha, ou um nome livre para colunas só de template. Único na tabela. */
  readonly key: EvoDataTableKey<T>;
  /** Texto do cabeçalho. */
  readonly label: string;
  /** Largura CSS (`'12rem'`, `'20%'`). */
  readonly width?: string;
  /** Alinhamento do cabeçalho e das células. Por omissão, `'start'`. */
  readonly align?: 'start' | 'center' | 'end';
  /**
   * Texto da célula. Por omissão, `row[key]`. É também o texto em que a
   * pesquisa no cliente procura.
   */
  readonly cell?: (row: T, index: number) => string;
  /** Permite ordenar por esta coluna (clicando no cabeçalho). */
  readonly sortable?: boolean;
  /**
   * Valor usado para ordenar no cliente. Por omissão, `row[key]`. Números e
   * datas ordenam-se como tal; o resto como texto, por ordem alfabética local.
   */
  readonly sortValue?: (row: T) => unknown;
  /** `false` tira a coluna da pesquisa no cliente. */
  readonly searchable?: boolean;
  /** Classe(s) do `<td>`, fixa(s) ou por linha. */
  readonly cellClass?: string | ((row: T) => string);
  /** Classe(s) do `<th>`. */
  readonly headerClass?: string;
}

/** O que a tabela pede a uma `source` (e emite, em modo servidor). */
export interface EvoDataTableQuery {
  /** Página pedida, a começar em 1. */
  readonly page: number;
  readonly pageSize: number;
  /** Texto da pesquisa, já com debounce e sem espaços nas pontas. */
  readonly search: string;
  readonly sort: EvoDataTableSort | null;
}

/** Uma página de resultados devolvida por uma `source`. */
export interface EvoDataTablePage<T> {
  readonly items: readonly T[];
  /** Total de registos que correspondem à pesquisa (todas as páginas). */
  readonly total: number;
}

/**
 * Carrega uma página do servidor. A tabela chama-a sempre que a página, o
 * tamanho, a pesquisa ou a ordenação mudam, e quando `reload()` é chamado.
 *
 * Um `Observable` (ex.: do `HttpClient`) é cancelado quando um pedido mais
 * recente o torna obsoleto; com uma `Promise`, usar o `abortSignal` recebido
 * (ex.: no `fetch`). Uma rejeição mostra o estado de erro com "Tentar de novo".
 *
 * ```ts
 * readonly facturas: EvoDataTableSource<Factura> = (q) =>
 *   this.http.get<EvoDataTablePage<Factura>>('/facturas', {
 *     params: { page: q.page, size: q.pageSize, q: q.search, sort: evoSortParam(q.sort) },
 *   });
 * ```
 */
export type EvoDataTableSource<T> = (
  query: EvoDataTableQuery,
  abortSignal: AbortSignal,
) => Promise<EvoDataTablePage<T>> | Observable<EvoDataTablePage<T>>;

/** Função de pesquisa no cliente: `true` mantém a linha. `termo` já vem normalizado. */
export type EvoDataTableSearchFn<T> = (
  row: T,
  termo: string,
  columns: readonly EvoDataTableColumn<T>[],
) => boolean;

/** Emitido por `(rowToggle)` ao expandir ou recolher uma linha. */
export interface EvoDataTableRowToggle<T> {
  readonly row: T;
  readonly expanded: boolean;
}

/**
 * `'nome,asc'` / `'nome,desc'` — o formato do Spring e da maioria das APIs.
 * Devolve `''` sem ordenação.
 */
export function evoSortParam(sort: EvoDataTableSort | null): string {
  return sort ? `${sort.key},${sort.direction}` : '';
}
