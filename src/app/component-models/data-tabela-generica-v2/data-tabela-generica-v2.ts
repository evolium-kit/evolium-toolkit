import { AfterContentInit, Component, ContentChild, ContentChildren, Directive, Input, QueryList, TemplateRef, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type LiteralUnion<T extends string> = T | (string & {});
export interface DataTabelaGenericaV2Header<T = any> {
  key: LiteralUnion<Extract<keyof T, string>>;
  label: string;
  width?: string;
  classes?: string;
  cell?: (row: T, index?: number) => string;
  cellClasses?: string | ((row: T) => string);
}

@Directive({
  selector: '[headerLeftV2]',
  standalone: true,
})
export class DataTabelaGenericaV2HeaderLeft {}
@Directive({
  selector: '[headerRightV2]',
  standalone: true,
})
export class DataTabelaGenericaV2HeaderRight {}
/**
 * Conteúdo opcional à esquerda da linha de paginação (ex: "A mostrar 1-3 de 124 registos").
 * Quando presente, a paginação passa a alinhar à direita em vez de ficar centrada.
 */
@Directive({
  selector: '[footerLeftV2]',
  standalone: true,
})
export class DataTabelaGenericaV2FooterLeft {}

// Diretiva para colunas específicas do meio da tabela
@Directive({
  selector: '[dataTabelaGenericaColV2]',
  standalone: true,
})
export class DataTabelaGenericaV2ColDirective {
  // Recebe a chave da coluna: [dataTabelaGenericaColV2]="'mensagem'"
  @Input('dataTabelaGenericaColV2') columnName!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}

// Diretiva padrão para a última coluna de ações
@Directive({
  selector: '[dataTabelaGenericaActionsV2]',
  standalone: true,
})
export class DataTabelaGenericaV2ActionsDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
@Component({
  selector: 'data-tabela-generica-v2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-tabela-generica-v2.html',
})
export class DataTabelaGenericaV2Component<T extends object> implements AfterContentInit {
  headers = input<DataTabelaGenericaV2Header<T>[]>([]);
  data = input<T[]>([]);
  pageSize = input(5);
  filter = input(false);
  filtroTexto = input('');
  carregando = input<boolean>(false);

  /**
   * Diz quais as linhas que respondem ao clique. Sem predicado nenhuma responde — a
   * tabela continua a ser só de leitura, como era antes.
   *
   * O clique na linha é uma conveniência para o rato: dê sempre também um botão
   * dentro da linha, senão quem usa teclado ou leitor de ecrã fica sem caminho.
   */
  linhaClicavel = input<((row: T) => boolean) | null>(null);

  linhaSelecionada = output<T>();

  // Captura a coluna de ações padrão da ponta direita
  @ContentChild(DataTabelaGenericaV2ActionsDirective)
  actions?: DataTabelaGenericaV2ActionsDirective;

  // Captura o conteúdo opcional à esquerda da paginação
  @ContentChild(DataTabelaGenericaV2FooterLeft)
  footerLeft?: DataTabelaGenericaV2FooterLeft;

  // Captura todas as colunas customizadas do meio da tabela
  @ContentChildren(DataTabelaGenericaV2ColDirective)
  customCols!: QueryList<DataTabelaGenericaV2ColDirective>;

  // Sinal ou propriedade para mapear as diretivas por chave de coluna de forma eficiente
  private colTemplatesMap = signal<Record<string, TemplateRef<any>>>({});

  readonly paginaAtual = signal(1);
  readonly filtroLocal = signal('');
  readonly filtroAtivo = computed(() => this.filtroTexto() || this.filtroLocal());

  readonly dataFiltrada = computed(() => {
    const filtro = this.filtroAtivo().toLowerCase();
    if (!filtro) return this.data();

    return this.data().filter(item => {
      return this.headers().some(header => {
        const valor = this.getCellValue(item, header).toString().toLowerCase();
        return valor.includes(filtro);
      });
    });
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.dataFiltrada().length / this.pageSize())));
  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));
  readonly dataPagina = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.pageSize();
    return this.dataFiltrada().slice(inicio, inicio + this.pageSize());
  });

  ngAfterContentInit() {
    if (this.paginaAtual() > this.totalPaginas()) {
      this.paginaAtual.set(this.totalPaginas());
    }

    // Mapeia as diretivas encontradas para um dicionário de chaves
    this.compilarTemplatesCustomizados();
  }

  private compilarTemplatesCustomizados() {
    const mapa: Record<string, TemplateRef<any>> = {};
    this.customCols.forEach(col => {
      if (col.columnName) {
        mapa[col.columnName] = col.templateRef;
      }
    });
    this.colTemplatesMap.set(mapa);
  }

  // Verifica se uma coluna específica possui um template customizado associado
  public getCustomTemplate(key: keyof T | string): TemplateRef<any> | null {
    return this.colTemplatesMap()[key as string] || null;
  }

  hasActions() {
    return !!this.actions?.templateRef;
  }

  hasFooterLeft() {
    return !!this.footerLeft;
  }

  getCellValue(item: T, header: DataTabelaGenericaV2Header<T>, index?: number) {
    if (header.cell) return header.cell(item, index);
    const key = header.key as keyof T;
    return item[key] ?? '';
  }

  getCellClass(item: T, header: DataTabelaGenericaV2Header<T>) {
    const defaultClass = 'text-sm text-[#3A3A3A]';
    const baseClass = header.classes ?? defaultClass;
    const cellClass = typeof header.cellClasses === 'function' ? header.cellClasses(item) : header.cellClasses ?? '';
    return [baseClass, cellClass].filter(Boolean).join(' ') || defaultClass;
  }

  podeClicarLinha(item: T): boolean {
    const predicado = this.linhaClicavel();
    return predicado ? predicado(item) : false;
  }

  classesLinha(item: T): string {
    return this.podeClicarLinha(item)
      ? 'cursor-pointer hover:bg-[#FDF2EA]'
      : 'hover:bg-[#FDF9F6]';
  }

  aoClicarLinha(item: T, evento: Event): void {
    if (!this.podeClicarLinha(item)) return;

    // Um clique num controlo da linha (menu de acções, link, campo) é desse controlo.
    const alvo = evento.target as HTMLElement | null;
    if (alvo?.closest('button, a, input, select, textarea, label, [role="menu"]')) return;

    this.linhaSelecionada.emit(item);
  }

  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaAtual.set(pagina);
  }

  onFilterChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.filtroLocal.set(valor);
    this.paginaAtual.set(1);
  }
}
