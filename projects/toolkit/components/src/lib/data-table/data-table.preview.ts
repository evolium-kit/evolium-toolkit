import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { EvoDataTable } from './evo-data-table';
import { EvoDataTableRowActions } from './data-table.directives';
import { EvoDataTableColumn } from './data-table.types';

interface Factura {
  readonly id: number;
  readonly numero: string;
  readonly cliente: string;
  readonly valor: number;
}

const CLIENTES = ['Sonangol', 'Unitel', 'BAI', 'Ângola Telecom', 'TAAG', 'Endiama'];

const FACTURAS: Factura[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  numero: `FT 2026/${String(i + 1).padStart(3, '0')}`,
  cliente: CLIENTES[i % CLIENTES.length],
  valor: 15000 + ((i * 7919) % 90000),
}));

/**
 * Pré-visualização para o Theme Studio: tabela interactiva (pesquisa,
 * ordenação, selecção, paginação), a carregar e vazia.
 */
@Component({
  selector: 'evo-data-table-preview',
  imports: [EvoDataTable, EvoDataTableRowActions],
  template: `
    <div class="pv__stack">
      <evo-data-table
        [columns]="colunas"
        [data]="facturas"
        [pageSize]="5"
        [pageSizeOptions]="[5, 10]"
        [size]="size() ?? 'md'"
        [(selection)]="seleccao"
        selectable
        searchable
        caption="Facturas"
      >
        <strong slot="toolbar-start">Facturas ({{ seleccao().length }} seleccionadas)</strong>
        <ng-template evoRowActions>
          <button type="button">Ver</button>
        </ng-template>
      </evo-data-table>

      <span class="pv__estado">
        <evo-data-table [columns]="colunas" [data]="[]" loading [size]="size() ?? 'md'" />
        A carregar
      </span>
      <span class="pv__estado">
        <evo-data-table [columns]="colunas" [data]="[]" [size]="size() ?? 'md'" />
        Vazia
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoDataTablePreview {
  readonly size = input<string | null>(null);
  protected readonly facturas = FACTURAS;
  protected readonly seleccao = signal<readonly Factura[]>([]);
  protected readonly colunas: EvoDataTableColumn<Factura>[] = [
    { key: 'numero', label: 'Número', sortable: true },
    { key: 'cliente', label: 'Cliente', sortable: true },
    {
      key: 'valor',
      label: 'Valor',
      align: 'end',
      sortable: true,
      cell: (f) => `${f.valor.toLocaleString('pt-AO')} Kz`,
    },
  ];
}
