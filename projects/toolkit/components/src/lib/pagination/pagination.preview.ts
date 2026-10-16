import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { EvoPagination } from './evo-pagination';

/** Pré-visualização para o Theme Studio: poucas páginas, muitas, com resumo e selector. */
@Component({
  selector: 'evo-pagination-preview',
  imports: [EvoPagination],
  template: `
    <div class="pv__stack">
      <span class="pv__estado">
        <evo-pagination [(page)]="pagina" [length]="50" [size]="size() ?? 'md'" />
        5 páginas (clica)
      </span>
      <span class="pv__estado">
        <evo-pagination [(page)]="paginaLonga" [length]="500" [size]="size() ?? 'md'" />
        50 páginas, com reticências
      </span>
      <span class="pv__estado">
        <evo-pagination
          [(page)]="paginaResumo"
          [(pageSize)]="porPagina"
          [length]="124"
          [pageSizeOptions]="[10, 25, 50]"
          [size]="size() ?? 'md'"
          showSummary
        />
        Resumo e linhas por página
      </span>
      <span class="pv__estado">
        <evo-pagination [page]="2" [length]="40" disabled [size]="size() ?? 'md'" />
        Desactivada
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoPaginationPreview {
  readonly size = input<string | null>(null);
  protected readonly pagina = signal(2);
  protected readonly paginaLonga = signal(24);
  protected readonly paginaResumo = signal(1);
  protected readonly porPagina = signal(10);
}
