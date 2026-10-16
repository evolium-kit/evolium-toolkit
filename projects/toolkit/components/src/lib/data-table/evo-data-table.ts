import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  resource,
  signal,
} from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkTableModule } from '@angular/cdk/table';
import { Observable, isObservable, take } from 'rxjs';
import { EvoSize } from '../component-types';
import { EvoButton } from '../button/evo-button';
import { EvoPagination } from '../pagination/evo-pagination';
import { evoNormalizeSearch } from '../select/select-option';
import { EvoTextField } from '../text-field/evo-text-field';
import {
  EvoDataTableCell,
  EvoDataTableRowActions,
  EvoDataTableRowContext,
  EvoDataTableRowDetail,
} from './data-table.directives';
import { EVO_DATA_TABLE_MESSAGES } from './data-table.messages';
import {
  EvoDataTableColumn,
  EvoDataTableKey,
  EvoDataTablePage,
  EvoDataTablePaging,
  EvoDataTableQuery,
  EvoDataTableRowToggle,
  EvoDataTableSearchFn,
  EvoDataTableSort,
  EvoDataTableSource,
} from './data-table.types';

/**
 * Uma linha desenhada: o registo (ou `null` numa linha-esqueleto), a sua
 * posição na lista completa e a chave estável usada no `track` e na selecção.
 */
interface Linha<T> {
  readonly row: T | null;
  readonly index: number;
  readonly key: unknown;
  /** Posição par na página (a 2.ª, 4.ª…), para a zebra. */
  readonly even: boolean;
}

/** Ids das colunas internas. Começam por `__` para não colidirem com campos. */
const COL_EXPANDIR = '__expand';
const COL_SELECCIONAR = '__select';
const COL_ACCOES = '__actions';
const COL_DETALHE = '__detail';

/** Ordem alfabética local, com números dentro do texto ("Lote 2" antes de "Lote 10"). */
const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function vazio(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

/** Compara dois valores de ordenação. Os vazios ficam sempre no fim, em qualquer sentido. */
function comparar(a: unknown, b: unknown, sentido: 1 | -1): number {
  if (vazio(a)) return vazio(b) ? 0 : 1;
  if (vazio(b)) return -1;
  if (a instanceof Date && b instanceof Date) return (a.getTime() - b.getTime()) * sentido;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * sentido;
  return COLLATOR.compare(String(a), String(b)) * sentido;
}

/**
 * Uma `Promise` a partir do que a `source` devolver. Um `Observable` é
 * cancelado (o pedido HTTP abortado) quando o `abortSignal` dispara.
 */
function paraPromessa<R>(valor: Promise<R> | Observable<R>, sinal: AbortSignal): Promise<R> {
  if (!isObservable(valor)) return valor;
  return new Promise<R>((resolver, rejeitar) => {
    const sub = valor.pipe(take(1)).subscribe({
      next: resolver,
      error: rejeitar,
      complete: () => rejeitar(new Error('EvoDataTable: a source terminou sem devolver valor.')),
    });
    sinal.addEventListener('abort', () => sub.unsubscribe(), { once: true });
  });
}

/** Contador de módulo, e não `crypto`: corre igual no servidor e não quebra a hidratação. */
let proximoId = 0;

/**
 * Tabela de dados com pesquisa, ordenação, paginação, selecção e linhas
 * expansíveis, com os dados em memória ou carregados de uma API.
 *
 * ```html
 * <!-- Dados em memória: a tabela filtra, ordena e pagina. -->
 * <evo-data-table [columns]="colunas" [data]="facturas()" searchable [pageSize]="10" />
 *
 * <!-- API: a tabela pede cada página, com debounce e cancelamento. -->
 * <evo-data-table [columns]="colunas" [source]="carregarFacturas" searchable />
 *
 * <!-- API controlada pelo pai: só emite page/pageSize/search/sort. -->
 * <evo-data-table [columns]="colunas" paging="server" [data]="pagina()" [total]="total()"
 *   [(page)]="p" [(search)]="q" [(sort)]="ordem" [loading]="aCarregar()" />
 * ```
 *
 * Assenta no `CdkTable` (semântica nativa `table`/`th`/`td`). A pesquisa é
 * um `EvoTextField`, a paginação um `EvoPagination`. Aparência por
 * `--evo-data-table-*` (e `--evo-pagination-*`). Ver README.md desta pasta.
 */
@Component({
  selector: 'evo-data-table',
  imports: [CdkTableModule, NgTemplateOutlet, EvoTextField, EvoPagination, EvoButton],
  template: `
    <div class="evo-data-table__toolbar">
      <div class="evo-data-table__toolbar-start">
        <ng-content select="[slot=toolbar-start]" />
      </div>
      <div class="evo-data-table__toolbar-end">
        @if (searchable()) {
          <evo-text-field
            class="evo-data-table__search"
            size="sm"
            type="search"
            hideLabel
            clearable
            [label]="mensagens.searchLabel"
            [placeholder]="searchPlaceholder() || mensagens.searchPlaceholder"
            [value]="termoCaixa()"
            (valueChange)="aoEscrever($event)"
          >
            <svg
              slot="prefix"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </evo-text-field>
        }
        <ng-content select="[slot=toolbar-end]" />
      </div>
    </div>

    <div class="evo-data-table__scroll" [style.max-height]="maxHeight() || null">
      @if (aRevalidar()) {
        <span class="evo-data-table__progress" aria-hidden="true"></span>
      }

      <table
        cdk-table
        class="evo-data-table__table"
        multiTemplateDataRows
        [dataSource]="linhas()"
        [trackBy]="trackLinha"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-busy]="aCarregar() ? 'true' : null"
      >
        @if (caption()) {
          <caption class="evo-data-table__caption">
            {{
              caption()
            }}
          </caption>
        }

        <!-- Expandir -->
        <ng-container [cdkColumnDef]="colExpandir">
          <th cdk-header-cell *cdkHeaderCellDef class="evo-data-table__control-cell">
            <span class="evo-data-table__sr-only">{{ mensagens.expandRow }}</span>
          </th>
          <td cdk-cell *cdkCellDef="let l" class="evo-data-table__control-cell">
            @if (l.row !== null) {
              <button
                type="button"
                class="evo-data-table__expand"
                [attr.aria-label]="mensagens.expandRow"
                [attr.aria-expanded]="estaExpandida(l)"
                [attr.aria-controls]="idDetalhe(l)"
                (click)="alternarExpansao(l)"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            }
          </td>
        </ng-container>

        <!-- Seleccionar -->
        <ng-container [cdkColumnDef]="colSeleccionar">
          <th cdk-header-cell *cdkHeaderCellDef class="evo-data-table__control-cell">
            <input
              type="checkbox"
              class="evo-data-table__checkbox"
              [attr.aria-label]="mensagens.selectPage"
              [checked]="paginaToda()"
              [indeterminate]="paginaParcial()"
              [disabled]="linhasReais().length === 0"
              (change)="alternarPagina()"
            />
          </th>
          <td cdk-cell *cdkCellDef="let l" class="evo-data-table__control-cell">
            @if (l.row !== null) {
              <input
                type="checkbox"
                class="evo-data-table__checkbox"
                [attr.aria-label]="mensagens.selectRow"
                [checked]="estaSeleccionada(l)"
                (change)="alternarSeleccao(l)"
              />
            }
          </td>
        </ng-container>

        <!-- Colunas de dados -->
        @for (col of columns(); track col.key) {
          <ng-container [cdkColumnDef]="col.key">
            <th
              cdk-header-cell
              *cdkHeaderCellDef
              [class]="col.headerClass ?? ''"
              [style.width]="col.width || null"
              [attr.data-evo-align]="col.align ?? null"
              [attr.aria-sort]="ariaSort(col)"
            >
              @if (col.sortable) {
                <button type="button" class="evo-data-table__sort" (click)="ordenar(col)">
                  {{ col.label }}
                  <svg
                    class="evo-data-table__sort-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    [attr.data-evo-direction]="sentidoDe(col)"
                  >
                    <path class="evo-data-table__sort-up" d="m8 10 4-4 4 4" />
                    <path class="evo-data-table__sort-down" d="m8 14 4 4 4-4" />
                  </svg>
                </button>
              } @else {
                {{ col.label }}
              }
            </th>
            <td
              cdk-cell
              *cdkCellDef="let l"
              [class]="classeCelula(col, l)"
              [attr.data-evo-align]="col.align ?? null"
            >
              @if (l.row === null) {
                <span class="evo-data-table__skeleton"></span>
              } @else if (templatesCelula().get(col.key); as tpl) {
                <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="contexto(l)" />
              } @else {
                {{ textoCelula(col, l.row, l.index) }}
              }
            </td>
          </ng-container>
        }

        <!-- Acções -->
        <ng-container [cdkColumnDef]="colAccoes">
          <th cdk-header-cell *cdkHeaderCellDef class="evo-data-table__actions-cell">
            {{ mensagens.actions }}
          </th>
          <td cdk-cell *cdkCellDef="let l" class="evo-data-table__actions-cell">
            @if (l.row === null) {
              <span class="evo-data-table__skeleton"></span>
            } @else if (templateAccoes(); as tpl) {
              <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="contexto(l)" />
            }
          </td>
        </ng-container>

        <!-- Detalhe (linha inteira por baixo) -->
        <ng-container [cdkColumnDef]="colDetalhe">
          <td
            cdk-cell
            *cdkCellDef="let l"
            class="evo-data-table__detail"
            [attr.colspan]="ids().length"
          >
            @if (l.row !== null && estaExpandida(l) && templateDetalhe(); as tpl) {
              <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="contexto(l)" />
            }
          </td>
        </ng-container>

        <tr cdk-header-row *cdkHeaderRowDef="ids(); sticky: stickyHeader()"></tr>
        <tr
          cdk-row
          *cdkRowDef="let l; columns: ids()"
          class="evo-data-table__row"
          [attr.data-evo-skeleton]="l.row === null ? '' : null"
          [attr.aria-hidden]="l.row === null ? 'true' : null"
          [attr.data-evo-even]="l.even ? '' : null"
          [attr.data-evo-clickable]="podeClicar(l) ? '' : null"
          [attr.data-evo-selected]="estaSeleccionada(l) ? '' : null"
          [attr.data-evo-expanded]="estaExpandida(l) ? '' : null"
          [attr.tabindex]="podeClicar(l) ? 0 : null"
          (click)="aoClicarLinha(l, $event)"
          (keydown)="aoTeclarLinha(l, $event)"
        ></tr>
        @if (templateDetalhe()) {
          <tr
            cdk-row
            *cdkRowDef="let l; columns: [colDetalhe]"
            class="evo-data-table__detail-row"
            [id]="idDetalhe(l)"
            [hidden]="!estaExpandida(l)"
          ></tr>
        }

        <tr *cdkNoDataRow class="evo-data-table__state-row">
          <td class="evo-data-table__state" [attr.colspan]="ids().length">
            @if (mensagemErro()) {
              <div class="evo-data-table__state-slot" role="alert">
                <ng-content select="[slot=error]" />
              </div>
              <div class="evo-data-table__state-default" role="alert">
                <p>{{ mensagemErro() }}</p>
                <button
                  evoButton
                  variant="outline"
                  size="sm"
                  type="button"
                  (click)="tentarDeNovo()"
                >
                  {{ mensagens.retry }}
                </button>
              </div>
            } @else {
              <div class="evo-data-table__state-slot">
                <ng-content select="[slot=empty]" />
              </div>
              <p class="evo-data-table__state-default">{{ textoVazio() }}</p>
            }
          </td>
        </tr>
      </table>
    </div>

    <ng-content select="[slot=summary]" />

    @if (mostraRodape()) {
      <div class="evo-data-table__footer">
        <div class="evo-data-table__footer-start">
          <ng-content select="[slot=footer-start]" />
        </div>
        <evo-pagination
          class="evo-data-table__pagination"
          hideSinglePage
          [page]="paginaActual()"
          [pageSize]="pageSize()"
          [length]="totalLinhas()"
          [pageSizeOptions]="pageSizeOptions()"
          [showSummary]="showSummary()"
          [size]="size()"
          (pageChange)="irParaPagina($event)"
          (pageSizeChange)="mudarTamanho($event)"
        />
      </div>
    }
  `,
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-data-table',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-loading]': 'aCarregar() ? "" : null',
    '[attr.data-evo-error]': 'mensagemErro() ? "" : null',
    '[attr.data-evo-sticky-header]': 'stickyHeader() ? "" : null',
  },
})
export class EvoDataTable<T = unknown> {
  // ------------------------------------------------------------- dados

  /** As colunas, pela ordem em que aparecem. */
  readonly columns = input<readonly EvoDataTableColumn<T>[]>([]);
  /**
   * As linhas. Com `paging="client"` (omissão), a lista completa — a tabela
   * pesquisa, ordena e pagina. Com `paging="server"`, só a página actual.
   * Ignorado com `source`.
   */
  readonly data = input<readonly T[] | null | undefined>([]);
  /**
   * Carrega cada página de uma API. Com isto a tabela trata sozinha do
   * pedido, do debounce da pesquisa, do cancelamento de pedidos obsoletos,
   * do carregamento e do erro. Implica `paging="server"`.
   */
  readonly source = input<EvoDataTableSource<T> | null>(null);
  /** Ver `EvoDataTablePaging`. `source` força `'server'`. */
  readonly paging = input<EvoDataTablePaging>('client');
  /** Total de registos, em `paging="server"` sem `source`. */
  readonly total = input<number | null | undefined>(null);
  /**
   * Com `source`: carregar também no render do servidor. Por omissão não —
   * sem transferência de estado, o pedido repetia-se no browser.
   */
  readonly ssr = input(false, { transform: booleanAttribute });

  // -------------------------------------------------------- navegação

  /** Página actual, a começar em 1. Suporta `[(page)]`. */
  readonly page = model(1);
  /** Linhas por página. Suporta `[(pageSize)]`. */
  readonly pageSize = model(10);
  /** Se tiver valores, mostra o selector de linhas por página. */
  readonly pageSizeOptions = input<readonly number[]>([]);
  /** Resumo "A mostrar 1–10 de 124" no rodapé. */
  readonly showSummary = input(true, { transform: booleanAttribute });
  /** Texto da pesquisa. Suporta `[(search)]` (actualizado depois do debounce). */
  readonly search = model('');
  /** Mostra a caixa de pesquisa na barra de cima. */
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchPlaceholder = input('');
  /** Debounce da pesquisa, em ms. Por omissão, 0 no cliente e 300 no servidor. */
  readonly searchDebounce = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Pesquisa no cliente. Por omissão, no texto de cada coluna, sem distinguir acentos. */
  readonly searchFn = input<EvoDataTableSearchFn<T> | null>(null);
  /** Ordenação activa. Suporta `[(sort)]`. */
  readonly sort = model<EvoDataTableSort | null>(null);

  // ---------------------------------------------------------- linhas

  /**
   * Identidade de uma linha, para o `track` e a selecção: um campo, ou uma
   * função. Por omissão, `row.id` se existir, senão o próprio objecto.
   */
  readonly rowKey = input<EvoDataTableKey<T> | ((row: T) => unknown) | null>(null);
  /**
   * Linhas que respondem ao clique (e a Enter/Espaço). `true` para todas, ou
   * um predicado. O clique num botão, link ou campo da linha é desse controlo.
   */
  readonly rowClickable = input<boolean | ((row: T) => boolean)>(false);
  /** Coluna de caixas de selecção. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Linhas seleccionadas (de qualquer página). Suporta `[(selection)]`. */
  readonly selection = model<readonly T[]>([]);

  // ---------------------------------------------------------- estado e aspecto

  /** A carregar (o `source` trata disto sozinho). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Erro a mostrar no lugar das linhas (o `source` trata disto sozinho). */
  readonly error = input<string | null | undefined>(null);
  /** Texto sem registos. Por omissão, o de `provideEvoDataTableMessages()`. */
  readonly emptyText = input('');
  /** Cabeçalho fixo no topo ao fazer scroll; usar com `maxHeight`. */
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  /** Altura máxima da zona das linhas (`'28rem'`); acima disto, scroll vertical. */
  readonly maxHeight = input('');
  /** Densidade das linhas. */
  readonly size = input<EvoSize>('md');
  /** Legenda da tabela, para leitores de ecrã (não visível). */
  readonly caption = input('');
  readonly ariaLabel = input('');

  /** Clique (ou Enter/Espaço) numa linha clicável. */
  readonly rowClick = output<T>();
  /** Uma linha foi expandida ou recolhida. */
  readonly rowToggle = output<EvoDataTableRowToggle<T>>();
  /** "Tentar de novo" no estado de erro. Com `source`, a tabela já repete o pedido. */
  readonly retry = output<void>();

  protected readonly mensagens = inject(EVO_DATA_TABLE_MESSAGES);
  protected readonly colExpandir = COL_EXPANDIR;
  protected readonly colSeleccionar = COL_SELECCIONAR;
  protected readonly colAccoes = COL_ACCOES;
  protected readonly colDetalhe = COL_DETALHE;

  private readonly id = `evo-data-table-${proximoId++}`;
  private readonly noBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly anunciador = inject(LiveAnnouncer);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  // ---------------------------------------------------------- templates

  /** `contentChildren`: uma coluna dentro de um `@if` que aparece depois também conta. */
  private readonly celulas = contentChildren(EvoDataTableCell);
  protected readonly templatesCelula = computed(
    () => new Map(this.celulas().map((c) => [c.evoCell(), c.template] as const)),
  );
  private readonly defAccoes = contentChild(EvoDataTableRowActions);
  protected readonly templateAccoes = computed(() => this.defAccoes()?.template ?? null);
  private readonly defDetalhe = contentChild(EvoDataTableRowDetail);
  protected readonly templateDetalhe = computed(() => this.defDetalhe()?.template ?? null);

  protected readonly ids = computed(() => [
    ...(this.templateDetalhe() ? [COL_EXPANDIR] : []),
    ...(this.selectable() ? [COL_SELECCIONAR] : []),
    ...this.columns().map((c) => c.key as string),
    ...(this.templateAccoes() ? [COL_ACCOES] : []),
  ]);

  // ---------------------------------------------------------- servidor

  private readonly modoServidor = computed(() => !!this.source() || this.paging() === 'server');

  /** Incrementado por `reload()`: um pedido novo com os mesmos parâmetros. */
  private readonly versao = signal(0);

  private readonly pedido = computed<(EvoDataTableQuery & { v: number }) | undefined>(() => {
    if (!this.source() || (!this.noBrowser && !this.ssr())) return undefined;
    return {
      page: Math.max(1, this.page()),
      pageSize: this.pageSize(),
      search: this.search().trim(),
      sort: this.sort(),
      v: this.versao(),
    };
  });

  private readonly remoto = resource({
    params: () => this.pedido(),
    loader: async ({ params, abortSignal }): Promise<EvoDataTablePage<T>> => {
      const { v: _v, ...query } = params;
      const resultado = await paraPromessa(this.source()!(query, abortSignal), abortSignal);
      this.aposCarregar(query, resultado.total);
      return resultado;
    },
  });

  /** A última página que chegou: fica à vista enquanto a seguinte carrega. */
  private readonly ultimaPagina = linkedSignal<
    EvoDataTablePage<T> | undefined,
    EvoDataTablePage<T> | undefined
  >({
    source: () => (this.remoto.hasValue() ? this.remoto.value() : undefined),
    computation: (nova, anterior) => nova ?? anterior?.value,
  });

  // ---------------------------------------------------------- cliente

  private readonly indexadas = computed(() =>
    (this.data() ?? []).map((row, index) => ({ row, index })),
  );

  private readonly filtradas = computed(() => {
    const todas = this.indexadas();
    const termo = evoNormalizeSearch(this.search());
    if (this.modoServidor() || !termo) return todas;
    const colunas = this.columns();
    const fn = this.searchFn();
    if (fn) return todas.filter(({ row }) => fn(row, termo, colunas));
    return todas.filter(({ row, index }) =>
      colunas.some(
        (c) =>
          c.searchable !== false &&
          evoNormalizeSearch(this.textoCelula(c, row, index)).includes(termo),
      ),
    );
  });

  private readonly ordenadas = computed(() => {
    const filtradas = this.filtradas();
    const ordem = this.sort();
    if (this.modoServidor() || !ordem) return filtradas;
    const col = this.columns().find((c) => c.key === ordem.key);
    const valor = col?.sortValue ?? ((row: T) => (row as Record<string, unknown>)[ordem.key]);
    const sentido = ordem.direction === 'desc' ? -1 : 1;
    return [...filtradas].sort((a, b) => comparar(valor(a.row), valor(b.row), sentido));
  });

  // ---------------------------------------------------------- vista

  readonly totalLinhas = computed(() => {
    if (this.source()) return this.ultimaPagina()?.total ?? 0;
    if (this.modoServidor()) return this.total() ?? this.data()?.length ?? 0;
    return this.ordenadas().length;
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalLinhas() / Math.max(1, this.pageSize()))),
  );

  /** A página pedida, presa ao total: nunca uma página vazia quando os dados encolhem. */
  readonly paginaActual = computed(() =>
    Math.min(Math.max(1, Math.trunc(this.page()) || 1), this.totalPaginas()),
  );

  readonly aCarregar = computed(
    () =>
      this.loading() ||
      (!!this.source() && (this.remoto.isLoading() || this.pedido() === undefined)),
  );

  protected readonly mensagemErro = computed(() => {
    const manual = this.error();
    if (manual) return manual;
    return this.source() && this.remoto.status() === 'error' ? this.mensagens.error : null;
  });

  /** As linhas da página, com a posição na lista completa e a chave. */
  protected readonly linhasReais = computed<Linha<T>[]>(() => {
    if (this.mensagemErro()) return [];
    const inicio = (this.paginaActual() - 1) * this.pageSize();
    if (this.modoServidor()) {
      const itens = this.source() ? (this.ultimaPagina()?.items ?? []) : (this.data() ?? []);
      return itens.map((row, i) => this.linha(row, inicio + i, i));
    }
    return this.ordenadas()
      .slice(inicio, inicio + this.pageSize())
      .map(({ row, index }, i) => this.linha(row, index, i));
  });

  /** Primeiro carregamento: linhas-esqueleto em vez de uma tabela vazia. */
  private readonly primeiraCarga = computed(
    () => this.aCarregar() && this.linhasReais().length === 0 && !this.mensagemErro(),
  );

  /** A recarregar com linhas à vista: só a barra fina por cima. */
  protected readonly aRevalidar = computed(() => this.aCarregar() && this.linhasReais().length > 0);

  protected readonly linhas = computed<Linha<T>[]>(() => {
    if (!this.primeiraCarga()) return this.linhasReais();
    const quantas = Math.min(Math.max(1, this.pageSize()), 8);
    return Array.from({ length: quantas }, (_, i) => ({
      row: null,
      index: i,
      key: `__esqueleto-${i}`,
      even: i % 2 === 1,
    }));
  });

  protected readonly textoVazio = computed(() => {
    const termo = this.search().trim();
    if (termo) return this.mensagens.noResults(termo);
    return this.emptyText() || this.mensagens.empty;
  });

  protected readonly mostraRodape = computed(
    () => !this.primeiraCarga() && !this.mensagemErro() && this.totalLinhas() > 0,
  );

  /** O que está na caixa de pesquisa — à frente do `search` durante o debounce. */
  protected readonly termoCaixa = linkedSignal(() => this.search());

  // ---------------------------------------------------------- selecção e expansão

  private readonly chavesSeleccionadas = computed(
    () => new Set(this.selection().map((row) => this.chaveDe(row))),
  );

  protected readonly paginaToda = computed(() => {
    const linhas = this.linhasReais();
    const sel = this.chavesSeleccionadas();
    return linhas.length > 0 && linhas.every((l) => sel.has(l.key));
  });

  protected readonly paginaParcial = computed(() => {
    const sel = this.chavesSeleccionadas();
    return !this.paginaToda() && this.linhasReais().some((l) => sel.has(l.key));
  });

  private readonly expandidas = signal<ReadonlySet<unknown>>(new Set());

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  // ---------------------------------------------------------- API pública

  /** Volta a pedir a página actual à `source` (ex.: depois de gravar um registo). */
  reload(): void {
    this.versao.update((v) => v + 1);
  }

  // ---------------------------------------------------------- linhas

  protected readonly trackLinha = (_: number, l: Linha<T>): unknown => l.key;

  private linha(row: T, index: number, posicao: number): Linha<T> {
    return { row, index, key: this.chaveDe(row), even: posicao % 2 === 1 };
  }

  private chaveDe(row: T): unknown {
    const chave = this.rowKey();
    if (typeof chave === 'function') return chave(row);
    const registo = row as Record<string, unknown>;
    if (chave) return registo[chave];
    return registo && typeof registo === 'object' && 'id' in registo ? registo['id'] : row;
  }

  protected contexto(l: Linha<T>): EvoDataTableRowContext<T> {
    return { $implicit: l.row as T, item: l.row as T, index: l.index };
  }

  protected textoCelula(col: EvoDataTableColumn<T>, row: T, index: number): string {
    if (col.cell) return col.cell(row, index);
    const valor = (row as Record<string, unknown>)[col.key];
    return vazio(valor) ? '' : String(valor);
  }

  protected classeCelula(col: EvoDataTableColumn<T>, l: Linha<T>): string {
    const c = col.cellClass;
    if (!c || l.row === null) return '';
    return typeof c === 'function' ? c(l.row) : c;
  }

  protected podeClicar(l: Linha<T>): boolean {
    if (l.row === null) return false;
    const regra = this.rowClickable();
    return typeof regra === 'function' ? regra(l.row) : regra;
  }

  protected aoClicarLinha(l: Linha<T>, evento: Event): void {
    if (!this.podeClicar(l)) return;
    // Um clique num controlo da linha (menu de acções, link, campo) é desse controlo.
    const alvo = evento.target as HTMLElement | null;
    if (alvo?.closest('button, a, input, select, textarea, label, [role="menu"]')) return;
    this.rowClick.emit(l.row as T);
  }

  protected aoTeclarLinha(l: Linha<T>, evento: KeyboardEvent): void {
    if (evento.target !== evento.currentTarget || !this.podeClicar(l)) return;
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    evento.preventDefault();
    this.rowClick.emit(l.row as T);
  }

  // ---------------------------------------------------------- selecção

  protected estaSeleccionada(l: Linha<T>): boolean {
    return l.row !== null && this.chavesSeleccionadas().has(l.key);
  }

  protected alternarSeleccao(l: Linha<T>): void {
    if (l.row === null) return;
    const actual = this.selection();
    this.selection.set(
      this.chavesSeleccionadas().has(l.key)
        ? actual.filter((row) => this.chaveDe(row) !== l.key)
        : [...actual, l.row],
    );
  }

  /** Marca as linhas da página, ou desmarca-as se já estiverem todas. Não mexe nas outras páginas. */
  protected alternarPagina(): void {
    const linhas = this.linhasReais();
    const chaves = new Set(linhas.map((l) => l.key));
    const fora = this.selection().filter((row) => !chaves.has(this.chaveDe(row)));
    this.selection.set(this.paginaToda() ? fora : [...fora, ...linhas.map((l) => l.row as T)]);
  }

  // ---------------------------------------------------------- expansão

  protected estaExpandida(l: Linha<T>): boolean {
    return l.row !== null && this.expandidas().has(l.key);
  }

  protected idDetalhe(l: Linha<T>): string {
    return `${this.id}-detalhe-${l.index}`;
  }

  protected alternarExpansao(l: Linha<T>): void {
    if (l.row === null) return;
    const seguinte = new Set(this.expandidas());
    const expandida = !seguinte.delete(l.key);
    if (expandida) seguinte.add(l.key);
    this.expandidas.set(seguinte);
    this.rowToggle.emit({ row: l.row, expanded: expandida });
  }

  // ---------------------------------------------------------- ordenação

  protected sentidoDe(col: EvoDataTableColumn<T>): 'asc' | 'desc' | null {
    const ordem = this.sort();
    return ordem && ordem.key === col.key ? ordem.direction : null;
  }

  protected ariaSort(col: EvoDataTableColumn<T>): string | null {
    const sentido = this.sentidoDe(col);
    if (sentido) return sentido === 'asc' ? 'ascending' : 'descending';
    return col.sortable ? 'none' : null;
  }

  /** Ascendente → descendente → sem ordenação. */
  protected ordenar(col: EvoDataTableColumn<T>): void {
    const sentido = this.sentidoDe(col);
    this.sort.set(
      sentido === null
        ? { key: col.key, direction: 'asc' }
        : sentido === 'asc'
          ? { key: col.key, direction: 'desc' }
          : null,
    );
    this.page.set(1);
  }

  // ---------------------------------------------------------- navegação

  protected irParaPagina(pagina: number): void {
    this.page.set(pagina);
  }

  protected mudarTamanho(tamanho: number): void {
    this.pageSize.set(tamanho);
    this.page.set(1);
  }

  protected aoEscrever(termo: string): void {
    this.termoCaixa.set(termo);
    clearTimeout(this.temporizador);
    const espera = this.searchDebounce() ?? (this.modoServidor() ? 300 : 0);
    if (espera <= 0 || !termo) {
      this.aplicarPesquisa(termo);
      return;
    }
    this.temporizador = setTimeout(() => this.aplicarPesquisa(termo), espera);
  }

  private aplicarPesquisa(termo: string): void {
    if (termo === this.search()) return;
    this.search.set(termo);
    this.page.set(1);
    // No servidor, o anúncio espera pela resposta (`aposCarregar`).
    if (!this.source()) this.anunciar();
  }

  protected tentarDeNovo(): void {
    this.retry.emit();
    if (this.source()) this.reload();
  }

  /** Depois de cada página do servidor: corrige uma página que deixou de existir, e anuncia. */
  private aposCarregar(query: EvoDataTableQuery, total: number): void {
    const paginas = Math.max(1, Math.ceil(total / Math.max(1, query.pageSize)));
    if (query.page > paginas) {
      this.page.set(paginas);
      return;
    }
    this.anunciar(total, query.page, paginas);
  }

  private anunciar(
    total = this.totalLinhas(),
    pagina = this.paginaActual(),
    paginas = this.totalPaginas(),
  ): void {
    if (!this.noBrowser) return;
    void this.anunciador.announce(this.mensagens.resultsAnnouncement(total, pagina, paginas));
  }
}
