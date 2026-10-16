import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { EvoSize } from '../component-types';
import { EvoInput } from '../input/evo-input';
import { EVO_PAGINATION_MESSAGES } from './pagination.messages';

/** Um elemento da lista de páginas: um número, ou reticências. */
export type EvoPageItem = number | 'gap';

function intervalo(de: number, ate: number): number[] {
  return de > ate ? [] : Array.from({ length: ate - de + 1 }, (_, i) => de + i);
}

/**
 * As páginas a mostrar: as `extremos` primeiras e últimas, e `vizinhos` de
 * cada lado da actual, com reticências nos buracos.
 *
 * O número de elementos é sempre o mesmo (`2 × extremos + 2 × vizinhos + 3`),
 * para os botões não saltarem de sítio ao mudar de página: perto de uma
 * ponta, a janela alarga para o outro lado; um buraco de uma só página
 * mostra essa página em vez de "…". Com menos páginas do que isso, mostra-as
 * todas.
 *
 * `evoPageItems(10, 20)` → `[1, 'gap', 9, 10, 11, 'gap', 20]`;
 * `evoPageItems(1, 20)` → `[1, 2, 3, 4, 5, 'gap', 20]`.
 */
export function evoPageItems(
  actual: number,
  total: number,
  vizinhos = 1,
  extremos = 1,
): EvoPageItem[] {
  if (total <= 0) return [];
  if (total <= 2 * extremos + 2 * vizinhos + 3) return intervalo(1, total);

  const inicio = Math.max(
    Math.min(actual - vizinhos, total - extremos - 2 * vizinhos - 1),
    extremos + 2,
  );
  const fim = Math.min(
    Math.max(actual + vizinhos, extremos + 2 * vizinhos + 2),
    total - extremos - 1,
  );

  return [
    ...intervalo(1, extremos),
    inicio > extremos + 2 ? 'gap' : extremos + 1,
    ...intervalo(inicio, fim),
    fim < total - extremos - 1 ? 'gap' : total - extremos,
    ...intervalo(total - extremos + 1, total),
  ];
}

/**
 * Paginação compacta: anterior/seguinte, páginas com reticências, resumo
 * "A mostrar 1–10 de 124" e selector de linhas por página (opcionais).
 *
 * ```html
 * <evo-pagination [(page)]="pagina" [(pageSize)]="porPagina" [length]="total()" />
 * <evo-pagination [(page)]="pagina" [length]="total()" [pageSizeOptions]="[10, 25, 50]" showSummary />
 * ```
 *
 * Não mostra dados: só emite a página e o tamanho escolhidos. Usado pelo
 * `evo-data-table`; serve também para listas de cartões, galerias, etc.
 * Aparência por `--evo-pagination-*`. Ver README.md desta pasta.
 */
@Component({
  selector: 'evo-pagination',
  imports: [EvoInput],
  template: `
    <nav class="evo-pagination__nav" [attr.aria-label]="ariaLabel() || mensagens.label">
      @if (showSummary()) {
        <span class="evo-pagination__summary">{{ resumo() }}</span>
      }

      @if (pageSizeOptions().length) {
        <label class="evo-pagination__size">
          <span>{{ mensagens.pageSize }}</span>
          <select
            evoInput
            size="sm"
            class="evo-pagination__size-select"
            [disabled]="disabled()"
            (change)="aoMudarTamanho($event)"
          >
            @for (opcao of pageSizeOptions(); track opcao) {
              <option [value]="opcao" [selected]="opcao === pageSize()">{{ opcao }}</option>
            }
          </select>
        </label>
      }

      @if (!(hideSinglePage() && totalPaginas() <= 1)) {
        <ul class="evo-pagination__pages">
          <li>
            <button
              type="button"
              class="evo-pagination__item evo-pagination__step"
              [attr.aria-label]="mensagens.previous"
              [disabled]="disabled() || actual() <= 1"
              (click)="irPara(actual() - 1)"
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
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </li>

          @for (item of itens(); track $index) {
            <li>
              @if (item === 'gap') {
                <span class="evo-pagination__gap" aria-hidden="true">…</span>
              } @else {
                <button
                  type="button"
                  class="evo-pagination__item"
                  [attr.aria-label]="mensagens.page(item)"
                  [attr.aria-current]="item === actual() ? 'page' : null"
                  [disabled]="disabled()"
                  (click)="irPara(item)"
                >
                  {{ item }}
                </button>
              }
            </li>
          }

          <li>
            <button
              type="button"
              class="evo-pagination__item evo-pagination__step"
              [attr.aria-label]="mensagens.next"
              [disabled]="disabled() || actual() >= totalPaginas()"
              (click)="irPara(actual() + 1)"
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
          </li>
        </ul>
      }
    </nav>
  `,
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-pagination',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-disabled]': 'disabled() ? "" : null',
  },
})
export class EvoPagination {
  /** Página actual, a começar em 1. Suporta `[(page)]`. */
  readonly page = model(1);
  /** Linhas por página. Suporta `[(pageSize)]`. */
  readonly pageSize = model(10);
  /** Número total de itens (não de páginas). */
  readonly length = input(0, { transform: numberAttribute });
  /** Se tiver valores, mostra o selector de linhas por página. */
  readonly pageSizeOptions = input<readonly number[]>([]);
  /** Páginas de cada lado da actual. */
  readonly siblings = input(1, { transform: numberAttribute });
  /** Páginas sempre visíveis no início e no fim. */
  readonly boundaries = input(1, { transform: numberAttribute });
  /** Mostra "A mostrar 1–10 de 124". */
  readonly showSummary = input(false, { transform: booleanAttribute });
  /** Esconde os botões quando só há uma página (o resumo e o selector ficam). */
  readonly hideSinglePage = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<EvoSize>('md');
  /** Nome acessível do `<nav>`. Por omissão, "Paginação". */
  readonly ariaLabel = input('');

  protected readonly mensagens = inject(EVO_PAGINATION_MESSAGES);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.length() / Math.max(1, this.pageSize()))),
  );

  /** A página pedida, presa entre 1 e o total — nunca uma página vazia. */
  protected readonly actual = computed(() =>
    Math.min(Math.max(1, Math.trunc(this.page()) || 1), this.totalPaginas()),
  );

  protected readonly itens = computed(() =>
    evoPageItems(this.actual(), this.totalPaginas(), this.siblings(), this.boundaries()),
  );

  protected readonly resumo = computed(() => {
    const total = this.length();
    if (total <= 0) return this.mensagens.summary(0, 0, 0);
    const de = (this.actual() - 1) * this.pageSize() + 1;
    return this.mensagens.summary(de, Math.min(de + this.pageSize() - 1, total), total);
  });

  protected irPara(pagina: number): void {
    if (this.disabled() || pagina < 1 || pagina > this.totalPaginas()) return;
    if (pagina !== this.page()) this.page.set(pagina);
  }

  /** Mudar o tamanho volta à página 1: a posição antiga deixa de fazer sentido. */
  protected aoMudarTamanho(evento: Event): void {
    const valor = Number((evento.target as HTMLSelectElement).value);
    if (!valor || valor === this.pageSize()) return;
    this.pageSize.set(valor);
    this.page.set(1);
  }
}
