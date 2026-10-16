import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, resource, signal } from '@angular/core';
import {
  EvoBadge,
  EvoButton,
  EvoCard,
  EvoDataTable,
  EvoDataTableCell,
  EvoDataTableColumn,
  EvoDataTablePage,
  EvoDataTableQuery,
  EvoDataTableRowActions,
  EvoDataTableRowDetail,
  EvoDataTableSort,
  EvoDataTableSource,
  EvoPagination,
  EvoSwitch,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { delay, of, throwError } from 'rxjs';

interface Motorista {
  readonly id: number;
  readonly nome: string;
  readonly provincia: string;
  readonly viagens: number;
  readonly activo: boolean;
  readonly desde: Date;
}

const NOMES = [
  'Ana',
  'Bruno',
  'Cátia',
  'Dário',
  'Edson',
  'Fátima',
  'Gaspar',
  'Hélder',
  'Inês',
  'Jacinto',
  'Kiala',
  'Lúcia',
  'Manuel',
  'Nádia',
  'Osvaldo',
];
const APELIDOS = [
  'Silva',
  'Domingos',
  'Neto',
  'Kiambata',
  'Lourenço',
  'Fernandes',
  'Mbala',
  'Tchissola',
];
const PROVINCIAS = ['Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Namibe', 'Uíge'];

const MOTORISTAS: Motorista[] = Array.from({ length: 137 }, (_, i) => ({
  id: i + 1,
  nome: `${NOMES[i % NOMES.length]} ${APELIDOS[(i * 3) % APELIDOS.length]}`,
  provincia: PROVINCIAS[(i * 5) % PROVINCIAS.length],
  viagens: (i * 37) % 420,
  activo: i % 4 !== 0,
  desde: new Date(2018 + (i % 8), (i * 7) % 12, 1 + (i % 27)),
}));

/** Simula uma API paginada: filtra, ordena e corta no "servidor". */
function responder(q: EvoDataTableQuery): EvoDataTablePage<Motorista> {
  const termo = q.search.toLowerCase();
  let todos = MOTORISTAS.filter(
    (m) =>
      !termo || m.nome.toLowerCase().includes(termo) || m.provincia.toLowerCase().includes(termo),
  );
  if (q.sort) {
    const { key, direction } = q.sort;
    const s = direction === 'asc' ? 1 : -1;
    todos = [...todos].sort((a, b) => {
      const va = a[key as keyof Motorista];
      const vb = b[key as keyof Motorista];
      return (va < vb ? -1 : va > vb ? 1 : 0) * s;
    });
  }
  const inicio = (q.page - 1) * q.pageSize;
  return { items: todos.slice(inicio, inicio + q.pageSize), total: todos.length };
}

/**
 * `<evo-data-table>` nos três modos (memória, `source`, servidor controlado
 * pelo pai), selecção, detalhe, clique, estados, tokens e `<evo-pagination>`.
 */
@Component({
  selector: 'app-data-table-demo',
  imports: [
    EvoCard,
    EvoButton,
    EvoBadge,
    EvoSwitch,
    EvoDataTable,
    EvoDataTableCell,
    EvoDataTableRowActions,
    EvoDataTableRowDetail,
    EvoPagination,
    EvoTokensDirective,
    JsonPipe,
  ],
  templateUrl: './data-table-demo.html',
  styleUrls: ['../shared/demo.css', './data-table-demo.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableDemo {
  protected readonly motoristas = MOTORISTAS;

  protected readonly colunas: EvoDataTableColumn<Motorista>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'provincia', label: 'Província', sortable: true },
    { key: 'viagens', label: 'Viagens', align: 'end', sortable: true },
    {
      key: 'desde',
      label: 'Desde',
      sortable: true,
      cell: (m) => m.desde.toLocaleDateString('pt-AO'),
    },
    { key: 'activo', label: 'Estado', searchable: false },
  ];

  // ------------------------------------------------ 1. em memória
  protected readonly seleccao = signal<readonly Motorista[]>([]);
  protected readonly ultimoClique = signal<Motorista | null>(null);
  protected readonly pagina = signal(1);
  protected readonly ordem = signal<EvoDataTableSort | null>(null);
  protected readonly soActivos = (m: Motorista) => m.activo;

  // ------------------------------------------------ 2. source
  protected readonly falhar = signal(false);
  protected readonly ultimaQuery = signal<EvoDataTableQuery | null>(null);
  protected readonly pedidos = signal(0);

  /** Observable com 700ms de latência: mudar de página antes de chegar cancela o anterior. */
  protected readonly carregar: EvoDataTableSource<Motorista> = (q) => {
    this.ultimaQuery.set(q);
    this.pedidos.update((n) => n + 1);
    if (this.falhar()) {
      return throwError(() => new Error('503')).pipe(delay(700));
    }
    return of(responder(q)).pipe(delay(700));
  };

  // ------------------------------------------------ 3. servidor, pelo pai
  protected readonly paginaPai = signal(1);
  protected readonly porPaginaPai = signal(8);
  protected readonly pesquisaPai = signal('');
  protected readonly ordemPai = signal<EvoDataTableSort | null>({
    key: 'viagens',
    direction: 'desc',
  });

  protected readonly paginaRemota = resource({
    params: () => ({
      page: this.paginaPai(),
      pageSize: this.porPaginaPai(),
      search: this.pesquisaPai(),
      sort: this.ordemPai(),
    }),
    loader: async ({ params }) => {
      await new Promise((r) => setTimeout(r, 400));
      return responder(params);
    },
  });

  // ------------------------------------------------ 4. estados
  protected readonly estadoCarregar = signal(true);
  protected readonly estadoErro = signal(false);

  // ------------------------------------------------ 5. paginação sozinha
  protected readonly paginaSolta = signal(7);
  protected readonly porPaginaSolta = signal(12);
  protected readonly cartoes = computed(() => {
    const inicio = (this.paginaSolta() - 1) * this.porPaginaSolta();
    return this.motoristas.slice(inicio, inicio + this.porPaginaSolta());
  });
}
