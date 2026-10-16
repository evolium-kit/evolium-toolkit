import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoDataTable } from './evo-data-table';
import {
  EvoDataTableCell,
  EvoDataTableRowActions,
  EvoDataTableRowDetail,
} from './data-table.directives';
import { evoDataTableMeta } from './data-table.tokens';
import {
  EvoDataTableColumn,
  EvoDataTablePage,
  EvoDataTableQuery,
  EvoDataTableRowToggle,
  EvoDataTableSort,
  EvoDataTableSource,
  evoSortParam,
} from './data-table.types';

interface Pessoa {
  readonly id: number;
  readonly nome: string;
  readonly idade: number;
  readonly cidade: string;
}

const NOMES = [
  'Ana',
  'Bruno',
  'Cátia',
  'Dário',
  'Eva',
  'Fábio',
  'Gil',
  'Hélio',
  'Inês',
  'João',
  'Kiala',
  'Lúcia',
];
const PESSOAS: Pessoa[] = NOMES.map((nome, i) => ({
  id: i + 1,
  nome,
  idade: 20 + ((i * 7) % 30),
  cidade: i % 2 ? 'Luanda' : 'Benguela',
}));

const COLUNAS: EvoDataTableColumn<Pessoa>[] = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'idade', label: 'Idade', sortable: true, align: 'end' },
  { key: 'cidade', label: 'Cidade', cell: (p) => p.cidade.toUpperCase() },
];

@Component({
  imports: [EvoDataTable, EvoDataTableCell, EvoDataTableRowActions, EvoDataTableRowDetail],
  template: `
    <evo-data-table
      [columns]="colunas()"
      [data]="dados()"
      [pageSize]="5"
      [(page)]="pagina"
      [(sort)]="ordem"
      [(search)]="pesquisa"
      [(selection)]="seleccao"
      [selectable]="seleccionavel()"
      [rowClickable]="clicavel"
      [loading]="aCarregar()"
      [error]="erro()"
      searchable
      caption="Pessoas"
      (rowClick)="clicadas.push($event)"
      (rowToggle)="expansoes.push($event)"
      (retry)="repeticoes = repeticoes + 1"
    >
      <span slot="toolbar-start">Pessoas</span>
      @if (comTemplate()) {
        <ng-template evoCell="cidade" [evoCellOf]="dados()" let-p let-i="index">
          <b class="cidade">{{ p.cidade }}#{{ i }}</b>
        </ng-template>
      }
      <ng-template evoRowActions [evoRowActionsOf]="dados()" let-p>
        <button type="button" class="editar">Editar {{ p.nome }}</button>
      </ng-template>
      @if (comDetalhe()) {
        <ng-template evoRowDetail [evoRowDetailOf]="dados()" let-p>
          <p class="detalhe">Detalhe de {{ p.nome }}</p>
        </ng-template>
      }
    </evo-data-table>
  `,
})
class Anfitriao {
  readonly colunas = signal(COLUNAS);
  readonly dados = signal<readonly Pessoa[]>(PESSOAS);
  readonly pagina = signal(1);
  readonly ordem = signal<EvoDataTableSort | null>(null);
  readonly pesquisa = signal('');
  readonly seleccao = signal<readonly Pessoa[]>([]);
  readonly seleccionavel = signal(false);
  readonly aCarregar = signal(false);
  readonly erro = signal<string | null>(null);
  readonly comTemplate = signal(false);
  readonly comDetalhe = signal(false);
  readonly clicavel = (p: Pessoa) => p.id !== 2;
  readonly clicadas: Pessoa[] = [];
  readonly expansoes: EvoDataTableRowToggle<Pessoa>[] = [];
  repeticoes = 0;
}

describe('EvoDataTable', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let host: HTMLElement;
  let app: Anfitriao;

  const render = () => fixture.detectChanges();
  const linhas = () => [...host.querySelectorAll<HTMLTableRowElement>('tr.evo-data-table__row')];
  const nomes = () => linhas().map((tr) => tr.querySelectorAll('td')[0]?.textContent?.trim());
  const cabecalhos = () => [...host.querySelectorAll('th')];
  const caixaPesquisa = () =>
    host.querySelector<HTMLInputElement>('.evo-data-table__search input')!;
  const escrever = (texto: string) => {
    const input = caixaPesquisa();
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    render();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    app = fixture.componentInstance;
    render();
    host = fixture.nativeElement.querySelector('evo-data-table');
  });

  describe('render', () => {
    it('desenha uma tabela nativa com cabeçalhos, a primeira página e a legenda', () => {
      expect(host.classList.contains('evo-data-table')).toBe(true);
      expect(host.querySelector('table')).not.toBeNull();
      expect(host.querySelector('caption')?.textContent?.trim()).toBe('Pessoas');
      expect(cabecalhos().map((th) => th.textContent?.trim())).toEqual([
        'Nome',
        'Idade',
        'Cidade',
        'Acções',
      ]);
      expect(nomes()).toEqual(['Ana', 'Bruno', 'Cátia', 'Dário', 'Eva']);
    });

    it('usa cell() para o texto e align para o alinhamento', () => {
      const primeira = linhas()[0].querySelectorAll('td');
      expect(primeira[2].textContent?.trim()).toBe('BENGUELA');
      expect(primeira[1].getAttribute('data-evo-align')).toBe('end');
    });

    it('desenha o template de acções com a linha no contexto', () => {
      expect(linhas()[0].querySelector('.editar')?.textContent?.trim()).toBe('Editar Ana');
    });

    it('um evoCell que aparece depois (dentro de @if) também é usado', () => {
      expect(host.querySelector('.cidade')).toBeNull();
      app.comTemplate.set(true);
      render();
      expect(linhas()[1].querySelector('.cidade')?.textContent).toBe('Luanda#1');
    });

    it('o rodapé mostra o resumo e a paginação', () => {
      expect(host.querySelector('.evo-pagination__summary')?.textContent?.trim()).toBe(
        'A mostrar 1–5 de 12',
      );
      expect(host.querySelectorAll('.evo-pagination__item:not(.evo-pagination__step)').length).toBe(
        3,
      );
    });
  });

  describe('paginação', () => {
    it('mudar de página mostra as linhas seguintes e actualiza o [(page)]', () => {
      host.querySelector<HTMLButtonElement>('[aria-label="Página 3"]')!.click();
      render();
      expect(app.pagina()).toBe(3);
      expect(nomes()).toEqual(['Kiala', 'Lúcia']);
    });

    it('quando os dados encolhem, não fica numa página vazia', () => {
      app.pagina.set(3);
      render();
      app.dados.set(PESSOAS.slice(0, 6));
      render();
      expect(nomes()).toEqual(['Fábio']);
    });
  });

  describe('pesquisa', () => {
    it('filtra sem distinguir acentos nem maiúsculas e volta à página 1', () => {
      app.pagina.set(2);
      render();
      escrever('ines');
      expect(app.pesquisa()).toBe('ines');
      expect(app.pagina()).toBe(1);
      expect(nomes()).toEqual(['Inês']);
    });

    it('procura no texto de cell(), não só no campo', () => {
      escrever('BENGUELA');
      expect(linhas().length).toBe(5);
      expect(host.querySelector('.evo-pagination__summary')?.textContent).toContain('de 6');
    });

    it('a caixa tem rótulo acessível', () => {
      expect(
        caixaPesquisa().getAttribute('aria-label') ?? host.querySelector('label')?.textContent,
      ).toBeTruthy();
    });

    it('sem resultados mostra a mensagem com o termo, sem rodapé', () => {
      escrever('zzz');
      expect(linhas().length).toBe(0);
      expect(host.querySelector('.evo-data-table__state-default')?.textContent?.trim()).toBe(
        'Nenhum resultado para "zzz".',
      );
      expect(host.querySelector('.evo-data-table__footer')).toBeNull();
    });

    it('um [(search)] vindo de fora também filtra e aparece na caixa', () => {
      app.pesquisa.set('kiala');
      render();
      expect(nomes()).toEqual(['Kiala']);
      expect(caixaPesquisa().value).toBe('kiala');
    });
  });

  describe('ordenação', () => {
    const botaoIdade = () =>
      cabecalhos()[1].querySelector<HTMLButtonElement>('.evo-data-table__sort')!;

    it('só as colunas sortable têm botão e aria-sort', () => {
      expect(cabecalhos()[0].getAttribute('aria-sort')).toBe('none');
      expect(cabecalhos()[2].hasAttribute('aria-sort')).toBe(false);
      expect(cabecalhos()[2].querySelector('button')).toBeNull();
    });

    it('asc → desc → sem ordenação, com aria-sort e [(sort)]', () => {
      botaoIdade().click();
      render();
      expect(app.ordem()).toEqual({ key: 'idade', direction: 'asc' });
      expect(cabecalhos()[1].getAttribute('aria-sort')).toBe('ascending');
      const idades = () => linhas().map((tr) => Number(tr.querySelectorAll('td')[1].textContent));
      expect(idades()).toEqual([...idades()].sort((a, b) => a - b));

      botaoIdade().click();
      render();
      expect(cabecalhos()[1].getAttribute('aria-sort')).toBe('descending');
      expect(idades()[0]).toBe(Math.max(...PESSOAS.map((p) => p.idade)));

      botaoIdade().click();
      render();
      expect(app.ordem()).toBeNull();
      expect(cabecalhos()[1].getAttribute('aria-sort')).toBe('none');
      expect(nomes()[0]).toBe('Ana');
    });

    it('ordena texto pela ordem local, com acentos', () => {
      app.ordem.set({ key: 'nome', direction: 'desc' });
      render();
      expect(nomes()[0]).toBe('Lúcia');
    });
  });

  describe('selecção', () => {
    beforeEach(() => {
      app.seleccionavel.set(true);
      render();
    });

    const caixas = () => [
      ...host.querySelectorAll<HTMLInputElement>('td .evo-data-table__checkbox'),
    ];
    const caixaPagina = () => host.querySelector<HTMLInputElement>('th .evo-data-table__checkbox')!;

    it('marcar uma linha actualiza o [(selection)] e o data-evo-selected', () => {
      caixas()[1].click();
      render();
      expect(app.seleccao().map((p) => p.nome)).toEqual(['Bruno']);
      expect(linhas()[1].hasAttribute('data-evo-selected')).toBe(true);
      expect(caixas()[1].getAttribute('aria-label')).toBe('Seleccionar linha');

      caixas()[1].click();
      render();
      expect(app.seleccao()).toEqual([]);
      expect(linhas()[1].hasAttribute('data-evo-selected')).toBe(false);
    });

    it('a caixa do cabeçalho marca a página e fica indeterminada com parte', () => {
      caixas()[0].click();
      render();
      expect(caixaPagina().indeterminate).toBe(true);

      caixaPagina().click();
      render();
      expect(app.seleccao().length).toBe(5);
      expect(caixaPagina().checked).toBe(true);
      expect(caixaPagina().indeterminate).toBe(false);

      caixaPagina().click();
      render();
      expect(app.seleccao()).toEqual([]);
    });

    it('a selecção sobrevive à mudança de página', () => {
      caixas()[0].click();
      render();
      host.querySelector<HTMLButtonElement>('[aria-label="Página 2"]')!.click();
      render();
      caixas()[0].click();
      render();
      expect(app.seleccao().map((p) => p.nome)).toEqual(['Ana', 'Fábio']);
    });
  });

  describe('clique na linha', () => {
    it('emite rowClick, e só nas linhas que o predicado aceita', () => {
      linhas()[0].querySelector('td')!.click();
      linhas()[1].querySelector('td')!.click();
      expect(app.clicadas.map((p) => p.nome)).toEqual(['Ana']);
    });

    it('só as linhas clicáveis entram na ordem de tabulação', () => {
      expect(linhas()[0].getAttribute('tabindex')).toBe('0');
      expect(linhas()[0].hasAttribute('data-evo-clickable')).toBe(true);
      expect(linhas()[1].hasAttribute('tabindex')).toBe(false);
    });

    it('um clique num botão da linha é do botão', () => {
      linhas()[0].querySelector<HTMLButtonElement>('.editar')!.click();
      expect(app.clicadas).toEqual([]);
    });

    it('Enter e Espaço na linha emitem rowClick', () => {
      linhas()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      linhas()[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(app.clicadas.map((p) => p.nome)).toEqual(['Ana', 'Cátia']);
    });
  });

  describe('linhas expansíveis', () => {
    beforeEach(() => {
      app.comDetalhe.set(true);
      render();
    });

    const expandir = (i: number) =>
      linhas()[i].querySelector<HTMLButtonElement>('.evo-data-table__expand')!;
    const detalhes = () => [...host.querySelectorAll<HTMLElement>('tr.evo-data-table__detail-row')];

    it('acrescenta a coluna de expandir, recolhida por omissão', () => {
      expect(expandir(0).getAttribute('aria-expanded')).toBe('false');
      expect(detalhes()[0].hidden).toBe(true);
      expect(host.querySelector('.detalhe')).toBeNull();
    });

    it('expandir mostra o detalhe, liga o aria-controls e emite rowToggle', () => {
      expandir(1).click();
      render();
      expect(expandir(1).getAttribute('aria-expanded')).toBe('true');
      expect(linhas()[1].hasAttribute('data-evo-expanded')).toBe(true);
      const detalhe = document.getElementById(expandir(1).getAttribute('aria-controls')!)!;
      expect(detalhe.hidden).toBe(false);
      expect(detalhe.textContent?.trim()).toBe('Detalhe de Bruno');
      expect(app.expansoes).toEqual([{ row: PESSOAS[1], expanded: true }]);

      expandir(1).click();
      render();
      expect(detalhe.hidden).toBe(true);
      expect(linhas()[1].hasAttribute('data-evo-expanded')).toBe(false);
      expect(app.expansoes[1].expanded).toBe(false);
    });
  });

  describe('estados', () => {
    it('a carregar sem linhas: esqueleto escondido dos leitores de ecrã e aria-busy', () => {
      app.dados.set([]);
      app.aCarregar.set(true);
      render();
      expect(host.hasAttribute('data-evo-loading')).toBe(true);
      expect(host.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
      expect(linhas().length).toBe(5);
      expect(linhas().every((tr) => tr.getAttribute('aria-hidden') === 'true')).toBe(true);
      expect(host.querySelectorAll('.evo-data-table__skeleton').length).toBeGreaterThan(0);

      app.aCarregar.set(false);
      render();
      expect(host.hasAttribute('data-evo-loading')).toBe(false);
      expect(host.querySelector('table')?.hasAttribute('aria-busy')).toBe(false);
      expect(host.querySelector('.evo-data-table__state-default')?.textContent?.trim()).toBe(
        'Sem registos.',
      );
    });

    it('a recarregar com linhas: mantém-nas e mostra a barra fina', () => {
      app.aCarregar.set(true);
      render();
      expect(nomes()[0]).toBe('Ana');
      expect(host.querySelector('.evo-data-table__progress')).not.toBeNull();
    });

    it('erro: alerta no lugar das linhas, e "Tentar de novo" emite retry', () => {
      app.erro.set('Falhou.');
      render();
      expect(linhas().length).toBe(0);
      expect(host.hasAttribute('data-evo-error')).toBe(true);
      const alerta = host.querySelector('.evo-data-table__state-default[role="alert"]')!;
      expect(alerta.textContent).toContain('Falhou.');
      alerta.querySelector<HTMLButtonElement>('button')!.click();
      expect(app.repeticoes).toBe(1);

      app.erro.set(null);
      render();
      expect(host.hasAttribute('data-evo-error')).toBe(false);
      expect(linhas().length).toBe(5);
    });
  });

  describe('regra 1: o CSS não declara os próprios tokens', () => {
    const css = () =>
      [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .filter((c) => c.includes('evo-data-table__table'))
        .join('\n');

    it('não declara nenhum --evo-data-table-*', () => {
      expect(css()).toContain('var(--evo-data-table-bg,');
      expect([...css().matchAll(/(^|[;{\s])(--evo-data-table-[a-z-]+)\s*:/g)]).toEqual([]);
    });

    it('cada token dos metadados é lido pelo CSS, e vice-versa', () => {
      const lidos = new Set(
        [...css().matchAll(/var\(--evo-(data-table-[a-z-]+)/g)].map((m) => m[1]),
      );
      expect([...lidos].sort()).toEqual(evoDataTableMeta.tokens.map((t) => t.name).sort());
    });
  });
});

// ------------------------------------------------------------------ source

@Component({
  imports: [EvoDataTable],
  template: `
    <evo-data-table
      [columns]="colunas"
      [source]="fonte"
      [pageSize]="5"
      [searchDebounce]="0"
      searchable
      [(page)]="pagina"
    />
  `,
})
class AnfitriaoFonte {
  readonly colunas = COLUNAS;
  readonly pagina = signal(1);
  readonly tabela = viewChild.required(EvoDataTable);
  readonly pedidos: { query: EvoDataTableQuery; sinal: AbortSignal }[] = [];
  falhar = false;

  readonly fonte: EvoDataTableSource<Pessoa> = async (query, sinal) => {
    this.pedidos.push({ query, sinal });
    if (this.falhar) throw new Error('rede');
    const termo = query.search.toLowerCase();
    const todas = PESSOAS.filter((p) => p.nome.toLowerCase().includes(termo));
    const inicio = (query.page - 1) * query.pageSize;
    return {
      items: todas.slice(inicio, inicio + query.pageSize),
      total: todas.length,
    } satisfies EvoDataTablePage<Pessoa>;
  };
}

describe('EvoDataTable com source', () => {
  let fixture: ComponentFixture<AnfitriaoFonte>;
  let host: HTMLElement;
  let app: AnfitriaoFonte;

  const estabilizar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const nomes = () =>
    [...host.querySelectorAll('tr.evo-data-table__row:not([data-evo-skeleton])')].map((tr) =>
      tr.querySelector('td')?.textContent?.trim(),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AnfitriaoFonte] }).compileComponents();
    fixture = TestBed.createComponent(AnfitriaoFonte);
    app = fixture.componentInstance;
    host = fixture.nativeElement.querySelector('evo-data-table');
  });

  it('pede a primeira página e mostra o total devolvido', async () => {
    await estabilizar();
    expect(app.pedidos[0].query).toEqual({ page: 1, pageSize: 5, search: '', sort: null });
    expect(nomes()).toEqual(['Ana', 'Bruno', 'Cátia', 'Dário', 'Eva']);
    expect(host.querySelector('.evo-pagination__summary')?.textContent?.trim()).toBe(
      'A mostrar 1–5 de 12',
    );
  });

  it('mudar de página pede a página nova e cancela a anterior se ainda pendente', async () => {
    await estabilizar();
    host.querySelector<HTMLButtonElement>('[aria-label="Página 2"]')!.click();
    host.querySelector<HTMLButtonElement>('[aria-label="Página 3"]')?.click();
    await estabilizar();
    expect(app.pedidos.at(-1)!.query.page).toBe(app.pagina());
    expect(nomes().length).toBeGreaterThan(0);
  });

  it('a pesquisa vai para o servidor (a tabela não filtra em memória)', async () => {
    await estabilizar();
    const input = host.querySelector<HTMLInputElement>('.evo-data-table__search input')!;
    input.value = 'eva';
    input.dispatchEvent(new Event('input'));
    await estabilizar();
    expect(app.pedidos.at(-1)!.query.search).toBe('eva');
    expect(nomes()).toEqual(['Eva']);
  });

  it('uma falha mostra o erro; "Tentar de novo" repete o pedido', async () => {
    app.falhar = true;
    await estabilizar();
    const alerta = host.querySelector('.evo-data-table__state-default[role="alert"]')!;
    expect(alerta.textContent).toContain('Não foi possível carregar os dados.');

    app.falhar = false;
    const antes = app.pedidos.length;
    alerta.querySelector<HTMLButtonElement>('button')!.click();
    await estabilizar();
    expect(app.pedidos.length).toBe(antes + 1);
    expect(nomes()[0]).toBe('Ana');
  });

  it('reload() repete o pedido com os mesmos parâmetros', async () => {
    await estabilizar();
    app.tabela().reload();
    await estabilizar();
    expect(app.pedidos.length).toBe(2);
    expect(app.pedidos[1].query).toEqual(app.pedidos[0].query);
  });

  it('uma página que deixou de existir passa para a última', async () => {
    app.pagina.set(9);
    await estabilizar();
    await estabilizar();
    expect(app.pagina()).toBe(3);
    expect(nomes()).toEqual(['Kiala', 'Lúcia']);
  });
});

describe('evoSortParam', () => {
  it('formata a ordenação para a API', () => {
    expect(evoSortParam({ key: 'nome', direction: 'desc' })).toBe('nome,desc');
    expect(evoSortParam(null)).toBe('');
  });
});
