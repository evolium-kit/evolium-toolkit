import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EvoSelect } from './evo-select';
import {
  EvoSelectOption,
  EvoSelectOptionDef,
  EvoSelectSearchFn,
  evoSelectDefaultSearch,
} from './select-option';
import { provideEvoSelectMessages } from './select.messages';
import { evoSelectMeta } from './select.tokens';

const FRUTAS: EvoSelectOption<string>[] = [
  { value: 'ana', label: 'Ananás', sublabel: 'Tropical', group: 'Tropicais' },
  { value: 'man', label: 'Manga', group: 'Tropicais', icon: '/assets/manga.svg' },
  { value: 'mac', label: 'Maçã', icon: 'star', iconClass: 'material-icons' },
  { value: 'per', label: 'Pêra', disabled: true },
];

@Component({
  imports: [EvoSelect],
  template: `
    <evo-select
      [(value)]="valor"
      [options]="opcoes()"
      [label]="label()"
      [hint]="hint()"
      [error]="erro()"
      [placeholder]="placeholder()"
      [size]="size()"
      [disabled]="desactivado()"
      [optional]="opcional()"
      [hideLabel]="esconderLabel()"
      [multiple]="multiplo()"
      [searchable]="pesquisavel()"
      [clearable]="limpavel()"
      [loading]="aCarregar()"
      [selectAll]="todos()"
      [maxLabels]="maximo()"
      [searchFn]="filtro()"
      (searchChange)="pesquisas.push($event)"
      (openedChange)="aberturas.push($event)"
    />
  `,
})
class Anfitriao {
  readonly valor = signal<string | string[] | null>(null);
  readonly opcoes = signal(FRUTAS);
  readonly label = signal('Fruta');
  readonly hint = signal('');
  readonly erro = signal<string | null>(null);
  readonly placeholder = signal('');
  readonly size = signal('md');
  readonly desactivado = signal(false);
  readonly opcional = signal(false);
  readonly esconderLabel = signal(false);
  readonly multiplo = signal(false);
  readonly pesquisavel = signal(false);
  readonly limpavel = signal(false);
  readonly aCarregar = signal(false);
  readonly todos = signal(false);
  readonly maximo = signal<number | undefined>(undefined);
  readonly filtro = signal<EvoSelectSearchFn | null>(evoSelectDefaultSearch);
  readonly pesquisas: string[] = [];
  readonly aberturas: boolean[] = [];
}

@Component({
  imports: [EvoSelect, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <evo-select formControlName="numero" label="Número" [options]="numeros" />
      <evo-select
        formControlName="pessoa"
        label="Pessoa"
        [options]="pessoas"
        [compareWith]="porId"
      />
      <evo-select formControlName="tags" label="Etiquetas" [options]="numeros" multiple />
    </form>
  `,
})
class AnfitriaoForm {
  readonly numeros: EvoSelectOption<number>[] = [
    { value: 1, label: 'Um' },
    { value: 2, label: 'Dois' },
    { value: 3, label: 'Três' },
  ];
  readonly pessoas: EvoSelectOption<{ id: number }>[] = [
    { value: { id: 7 }, label: 'Ana' },
    { value: { id: 8 }, label: 'Bruno' },
  ];
  readonly porId = (a: { id: number }, b: { id: number }) => a?.id === b?.id;
  readonly form = new FormGroup({
    numero: new FormControl<number | null>(null, Validators.required),
    pessoa: new FormControl<{ id: number } | null>({ id: 8 }),
    tags: new FormControl<number[]>([2]),
  });
}

@Component({
  imports: [EvoSelect, EvoSelectOptionDef],
  template: `
    <evo-select label="A" [options]="opcoes" class="novo">
      <ng-template [evoSelectOption]="opcoes" let-opcao let-marcada="selected">
        <b class="custom">{{ opcao.label }}{{ marcada ? '!' : '' }}</b>
      </ng-template>
    </evo-select>
    <evo-select label="B" [options]="opcoes" value="man" class="legado">
      <ng-template #optionTemplate let-opcao let-marcada="selected">
        <i class="legado-item">{{ opcao.label }}{{ marcada ? '!' : '' }}</i>
      </ng-template>
    </evo-select>
  `,
})
class AnfitriaoTemplate {
  readonly opcoes = FRUTAS;
}

describe('EvoSelect', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let a: Anfitriao;
  let host: HTMLElement;

  const gatilho = () => host.querySelector<HTMLElement>('.evo-select__trigger')!;
  const caixa = () => host.querySelector<HTMLElement>('.evo-select__box')!;
  const lista = () => document.querySelector<HTMLElement>('.evo-select__list');
  const opcoes = () => [...document.querySelectorAll<HTMLElement>('.evo-select__option')];
  const mensagem = () => host.querySelector('.evo-select__message')!;
  const pesquisa = () => document.querySelector<HTMLInputElement>('.evo-select__search-input');
  const actualizar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** O ListKeyManager do CDK lê `keyCode`; o componente lê `key`. O browser dá os dois. */
  const CODIGOS: Record<string, number> = {
    Enter: 13,
    Escape: 27,
    ' ': 32,
    End: 35,
    Home: 36,
    ArrowUp: 38,
    ArrowDown: 40,
  };
  const tecla = async (alvo: HTMLElement, key: string) => {
    alvo.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode: CODIGOS[key], bubbles: true }));
    await actualizar();
  };
  const abrir = async () => {
    caixa().click();
    await actualizar();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    a = fixture.componentInstance;
    await actualizar();
    host = fixture.nativeElement.querySelector('evo-select');
  });

  afterEach(() => fixture?.destroy());

  it('renderiza etiqueta, dentro de evo-field, com a caixa evo-input e um combobox', () => {
    const label = host.querySelector('label')!;
    expect(host.classList.contains('evo-select')).toBe(true);
    expect(host.querySelector('evo-field')).not.toBeNull();
    expect(caixa().classList.contains('evo-input')).toBe(true);
    expect(label.textContent).toContain('Fruta');
    expect(gatilho().getAttribute('role')).toBe('combobox');
    expect(gatilho().getAttribute('aria-haspopup')).toBe('listbox');
    expect(gatilho().getAttribute('aria-expanded')).toBe('false');
    expect(gatilho().getAttribute('aria-labelledby')).toContain(label.id);
    expect(gatilho().getAttribute('tabindex')).toBe('0');
    expect(gatilho().id).toMatch(/^evo-select-\d+$/);
  });

  it('sem valor mostra o placeholder por omissão, ou o dado', async () => {
    expect(gatilho().textContent).toContain('Seleccione…');
    a.placeholder.set('Escolha uma fruta');
    await actualizar();
    expect(gatilho().textContent).toContain('Escolha uma fruta');
  });

  it('size reflecte-se no host e na caixa', async () => {
    a.size.set('lg');
    await actualizar();
    expect(host.getAttribute('data-evo-size')).toBe('lg');
    expect(caixa().getAttribute('data-evo-size')).toBe('lg');
  });

  it('um clique abre o listbox e liga-o ao combobox; outro fecha', async () => {
    await abrir();
    expect(gatilho().getAttribute('aria-expanded')).toBe('true');
    expect(host.hasAttribute('data-evo-open')).toBe(true);
    expect(lista()!.getAttribute('role')).toBe('listbox');
    expect(gatilho().getAttribute('aria-controls')).toBe(lista()!.id);
    expect(opcoes().map((o) => o.getAttribute('role'))).toEqual([
      'option',
      'option',
      'option',
      'option',
    ]);
    expect(a.aberturas).toEqual([true]);

    await abrir();
    expect(gatilho().getAttribute('aria-expanded')).toBe('false');
    expect(gatilho().hasAttribute('aria-controls')).toBe(false);
    expect(host.hasAttribute('data-evo-open')).toBe(false);
    expect(lista()).toBeNull();
    expect(a.aberturas).toEqual([true, false]);
  });

  /**
   * Com Popover API, o CDK insere o painel ao lado da caixa (dentro do host),
   * e ele herda os [evoTokens]. Sem ela — como no jsdom — cai no contentor
   * global de overlays. O caso real verifica-se no browser, no playground.
   */
  it('o painel fica dentro do evo-select se houver Popover API; senão, no contentor global', async () => {
    await abrir();
    if ('showPopover' in document.body) {
      expect(host.contains(lista())).toBe(true);
    } else {
      expect(lista()!.closest('.cdk-overlay-container')).not.toBeNull();
    }
  });

  it('escolher uma opção actualiza [(value)], fecha e mostra o nome', async () => {
    await abrir();
    opcoes()[1].click();
    await actualizar();
    expect(a.valor()).toBe('man');
    expect(lista()).toBeNull();
    expect(gatilho().textContent).toContain('Manga');

    await abrir();
    expect(opcoes()[1].getAttribute('aria-selected')).toBe('true');
    expect(opcoes()[0].getAttribute('aria-selected')).toBe('false');
  });

  it('uma opção desactivada tem aria-disabled e não se escolhe', async () => {
    await abrir();
    const pera = opcoes()[3];
    expect(pera.getAttribute('aria-disabled')).toBe('true');
    pera.click();
    await actualizar();
    expect(a.valor()).toBeNull();
  });

  describe('teclado', () => {
    it('Seta abaixo abre e destaca a primeira; setas movem; Enter escolhe', async () => {
      await tecla(gatilho(), 'ArrowDown');
      expect(gatilho().getAttribute('aria-expanded')).toBe('true');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
      expect(opcoes()[0].hasAttribute('data-evo-active')).toBe(true);

      await tecla(gatilho(), 'ArrowDown');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[1].id);
      expect(opcoes()[0].hasAttribute('data-evo-active')).toBe(false);

      await tecla(gatilho(), 'Enter');
      expect(a.valor()).toBe('man');
      expect(gatilho().getAttribute('aria-expanded')).toBe('false');
      expect(gatilho().hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('ao abrir destaca a opção já escolhida', async () => {
      a.valor.set('mac');
      await actualizar();
      await tecla(gatilho(), 'Enter');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[2].id);
    });

    it('salta as opções desactivadas e dá a volta; End e Home', async () => {
      await tecla(gatilho(), 'ArrowDown');
      await tecla(gatilho(), 'End');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[2].id);
      await tecla(gatilho(), 'ArrowDown');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
      await tecla(gatilho(), 'ArrowUp');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[2].id);
      await tecla(gatilho(), 'Home');
      expect(gatilho().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
    });

    it('Escape fecha sem escolher', async () => {
      await tecla(gatilho(), 'ArrowDown');
      await tecla(gatilho(), 'Escape');
      expect(gatilho().getAttribute('aria-expanded')).toBe('false');
      expect(a.valor()).toBeNull();
    });

    it('Espaço abre e escolhe', async () => {
      await tecla(gatilho(), ' ');
      expect(gatilho().getAttribute('aria-expanded')).toBe('true');
      await tecla(gatilho(), ' ');
      expect(a.valor()).toBe('ana');
    });
  });

  describe('escolha múltipla', () => {
    beforeEach(async () => {
      a.multiplo.set(true);
      a.valor.set([]);
      await actualizar();
    });

    it('marca e desmarca sem fechar; o listbox é multiselectable', async () => {
      await abrir();
      expect(lista()!.getAttribute('aria-multiselectable')).toBe('true');
      opcoes()[0].click();
      await actualizar();
      opcoes()[2].click();
      await actualizar();
      expect(a.valor()).toEqual(['ana', 'mac']);
      expect(lista()).not.toBeNull();

      opcoes()[0].click();
      await actualizar();
      expect(a.valor()).toEqual(['mac']);
    });

    it('mostra os nomes, ou "N seleccionados" acima de maxLabels', async () => {
      a.valor.set(['ana', 'mac']);
      await actualizar();
      expect(gatilho().textContent).toContain('Ananás, Maçã');
      a.maximo.set(1);
      await actualizar();
      expect(gatilho().textContent).toContain('2 seleccionados');
    });

    it('"Seleccionar todos" marca as disponíveis e, de novo, desmarca-as', async () => {
      a.todos.set(true);
      await actualizar();
      await abrir();
      const todos = document.querySelector<HTMLElement>('.evo-select__option--all')!;
      expect(todos.getAttribute('role')).toBe('option');
      expect(todos.getAttribute('aria-selected')).toBe('false');

      todos.click();
      await actualizar();
      expect(a.valor()).toEqual(['ana', 'man', 'mac']);
      expect(todos.getAttribute('aria-selected')).toBe('true');

      todos.click();
      await actualizar();
      expect(a.valor()).toEqual([]);
    });
  });

  describe('pesquisa', () => {
    beforeEach(async () => {
      a.pesquisavel.set(true);
      await actualizar();
    });

    const escrever = async (texto: string) => {
      pesquisa()!.value = texto;
      pesquisa()!.dispatchEvent(new Event('input'));
      await actualizar();
    };

    it('foca a pesquisa ao abrir; é um combobox ligado à lista', async () => {
      await abrir();
      expect(document.activeElement).toBe(pesquisa());
      expect(pesquisa()!.getAttribute('role')).toBe('combobox');
      expect(pesquisa()!.getAttribute('aria-controls')).toBe(lista()!.id);
      expect(pesquisa()!.getAttribute('aria-label')).toBe('Pesquisar opções');
    });

    it('filtra sem distinguir acentos, também no sublabel, e emite searchChange', async () => {
      await abrir();
      const nomes = () =>
        [...document.querySelectorAll('.evo-select__option-label')].map((e) => e.textContent);
      await escrever('maca');
      expect(nomes()).toEqual(['Maçã']);
      await escrever('tropical');
      expect(nomes()).toEqual(['Ananás']);
      expect(a.pesquisas).toEqual(['maca', 'tropical']);
    });

    it('escrever no gatilho abre e começa a pesquisa (as letras não se perdem)', async () => {
      gatilho().dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
      gatilho().dispatchEvent(new KeyboardEvent('keydown', { key: 'u', bubbles: true }));
      await actualizar();
      expect(gatilho().getAttribute('aria-expanded')).toBe('true');
      expect(pesquisa()!.value).toBe('hu');
      expect(a.pesquisas).toEqual(['h', 'hu']);
    });

    it('sem resultados, mostra a mensagem', async () => {
      await abrir();
      await escrever('kiwi');
      expect(opcoes()).toEqual([]);
      expect(document.querySelector('.evo-select__empty')!.textContent).toContain(
        'Nenhuma opção encontrada',
      );
    });

    it('as setas e o Enter funcionam a partir da pesquisa; fechar limpa o texto', async () => {
      await abrir();
      await escrever('ma');
      await tecla(pesquisa()!, 'ArrowDown');
      expect(pesquisa()!.getAttribute('aria-activedescendant')).toBe(opcoes()[1].id);
      await tecla(pesquisa()!, 'Enter');
      expect(a.valor()).toBe('mac');
      expect(a.pesquisas.at(-1)).toBe('');
    });

    it('searchFn null desliga o filtro local (pesquisa no servidor)', async () => {
      a.filtro.set(null);
      await actualizar();
      await abrir();
      await escrever('kiwi');
      expect(opcoes().length).toBe(4);
    });
  });

  it('agrupa por group: role=group com o nome como rótulo', async () => {
    await abrir();
    const grupos = [...document.querySelectorAll<HTMLElement>('.evo-select__group')];
    const tropicais = grupos.find((g) => g.getAttribute('role') === 'group')!;
    const rotulo = document.getElementById(tropicais.getAttribute('aria-labelledby')!)!;
    expect(rotulo.textContent!.trim()).toBe('Tropicais');
    expect(tropicais.querySelectorAll('[role=option]').length).toBe(2);
    expect(grupos.find((g) => g.getAttribute('role') === 'presentation')).toBeDefined();
  });

  it('ícones: imagem com alt vazio; texto num span com iconClass; sublabel na 2.ª linha', async () => {
    await abrir();
    const img = opcoes()[1].querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/assets/manga.svg');
    expect(img.getAttribute('alt')).toBe('');
    const span = opcoes()[2].querySelector('span.evo-select__icon')!;
    expect(span.textContent).toBe('star');
    expect(span.classList.contains('material-icons')).toBe(true);
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(opcoes()[0].querySelector('.evo-select__sublabel')!.textContent).toBe('Tropical');
  });

  it('clearable: o × só aparece com valor, e limpa-o', async () => {
    a.limpavel.set(true);
    await actualizar();
    expect(host.querySelector('.evo-select__clear')).toBeNull();

    a.valor.set('ana');
    await actualizar();
    const limpar = host.querySelector<HTMLButtonElement>('.evo-select__clear')!;
    expect(limpar.getAttribute('aria-label')).toBe('Limpar');
    limpar.click();
    await actualizar();
    expect(a.valor()).toBeNull();
    expect(lista()).toBeNull();
    expect(host.querySelector('.evo-select__clear')).toBeNull();
  });

  it('loading: indicador, aria-busy e "A carregar…" com a lista vazia', async () => {
    a.aCarregar.set(true);
    a.opcoes.set([]);
    await actualizar();
    expect(host.querySelector('.evo-select__spinner')).not.toBeNull();
    expect(gatilho().getAttribute('aria-busy')).toBe('true');
    expect(host.hasAttribute('data-evo-loading')).toBe(true);
    await abrir();
    expect(document.querySelector('.evo-select__empty')!.textContent).toContain('A carregar…');

    a.aCarregar.set(false);
    await actualizar();
    expect(gatilho().hasAttribute('aria-busy')).toBe(false);
    expect(host.querySelector('.evo-select__spinner')).toBeNull();
  });

  it('hint é anunciado pelo aria-describedby', async () => {
    a.hint.set('A preferida.');
    await actualizar();
    expect(mensagem().textContent).toContain('A preferida.');
    expect(gatilho().getAttribute('aria-describedby')).toBe(mensagem().id);
  });

  it('erro manual: aria-invalid, data-evo-invalid, e não fica para trás ao sair', async () => {
    a.erro.set('Escolha uma fruta.');
    await actualizar();
    expect(mensagem().textContent).toContain('Escolha uma fruta.');
    expect(mensagem().getAttribute('data-evo-tone')).toBe('error');
    expect(gatilho().getAttribute('aria-invalid')).toBe('true');
    expect(host.hasAttribute('data-evo-invalid')).toBe(true);

    a.erro.set(null);
    await actualizar();
    expect(mensagem().hasAttribute('data-evo-tone')).toBe(false);
    expect(gatilho().hasAttribute('aria-invalid')).toBe(false);
    expect(host.hasAttribute('data-evo-invalid')).toBe(false);
  });

  it('disabled: fora da ordem de Tab, aria-disabled, e não abre', async () => {
    a.desactivado.set(true);
    await actualizar();
    expect(gatilho().getAttribute('tabindex')).toBe('-1');
    expect(gatilho().getAttribute('aria-disabled')).toBe('true');
    expect(host.hasAttribute('data-evo-disabled')).toBe(true);
    await abrir();
    await tecla(gatilho(), 'ArrowDown');
    expect(lista()).toBeNull();

    a.desactivado.set(false);
    await actualizar();
    expect(gatilho().hasAttribute('aria-disabled')).toBe(false);
    expect(host.hasAttribute('data-evo-disabled')).toBe(false);
  });

  it('optional mostra "(opcional)"; hideLabel marca o host', async () => {
    a.opcional.set(true);
    a.esconderLabel.set(true);
    await actualizar();
    expect(host.querySelector('.evo-select__optional')!.textContent).toContain('(opcional)');
    expect(host.hasAttribute('data-evo-hide-label')).toBe(true);
  });

  describe('com Reactive Forms', () => {
    let ff: ComponentFixture<AnfitriaoForm>;
    let form: AnfitriaoForm['form'];
    const hosts = () => [...ff.nativeElement.querySelectorAll('evo-select')] as HTMLElement[];
    const gatilhos = () =>
      hosts().map((h) => h.querySelector<HTMLElement>('.evo-select__trigger')!);
    const actualizarForm = async () => {
      ff.detectChanges();
      await ff.whenStable();
    };
    const abrirForm = async (i: number) => {
      hosts()[i].querySelector<HTMLElement>('.evo-select__box')!.click();
      await actualizarForm();
    };

    beforeEach(async () => {
      ff = TestBed.createComponent(AnfitriaoForm);
      await actualizarForm();
      form = ff.componentInstance.form;
    });

    afterEach(() => ff.destroy());

    it('valores numéricos mantêm o tipo (não passam a string)', async () => {
      form.controls.numero.setValue(3);
      await actualizarForm();
      expect(gatilhos()[0].textContent).toContain('Três');

      await abrirForm(0);
      opcoes()[1].click();
      await actualizarForm();
      expect(form.controls.numero.value).toBe(2);
    });

    it('compareWith: objectos iguais por id, não por referência', async () => {
      expect(gatilhos()[1].textContent).toContain('Bruno');
    });

    it('escolha múltipla com números', async () => {
      expect(gatilhos()[2].textContent).toContain('Dois');
      await abrirForm(2);
      opcoes()[0].click();
      await actualizarForm();
      expect(form.controls.tags.value).toEqual([2, 1]);
    });

    it('Validators.required dá asterisco e aria-required', () => {
      expect(hosts()[0].querySelector('.evo-select__required')).not.toBeNull();
      expect(gatilhos()[0].getAttribute('aria-required')).toBe('true');
      expect(gatilhos()[1].hasAttribute('aria-required')).toBe(false);
    });

    it('touched ao fechar o painel, ou ao sair do gatilho fechado', async () => {
      await abrirForm(0);
      expect(form.controls.numero.touched).toBe(false);
      await abrirForm(0);
      expect(form.controls.numero.touched).toBe(true);

      gatilhos()[1].dispatchEvent(new Event('blur'));
      expect(form.controls.pessoa.touched).toBe(true);
    });

    it('erro automático só depois de touched, com a mensagem partilhada', async () => {
      expect(hosts()[0].hasAttribute('data-evo-invalid')).toBe(false);
      form.controls.numero.markAsTouched();
      await actualizarForm();
      expect(hosts()[0].querySelector('.evo-select__message')!.textContent).toContain(
        'Campo obrigatório.',
      );
      form.controls.numero.setValue(1);
      await actualizarForm();
      expect(hosts()[0].hasAttribute('data-evo-invalid')).toBe(false);
    });

    it('control.disable() desactiva de facto', async () => {
      form.controls.numero.disable();
      await actualizarForm();
      expect(gatilhos()[0].getAttribute('aria-disabled')).toBe('true');
      form.controls.numero.enable();
      await actualizarForm();
      expect(gatilhos()[0].hasAttribute('aria-disabled')).toBe(false);
    });
  });

  describe('templates de opção', () => {
    it('evoSelectOption e o #optionTemplate do original substituem o conteúdo', async () => {
      const ft = TestBed.createComponent(AnfitriaoTemplate);
      ft.detectChanges();
      await ft.whenStable();

      ft.nativeElement.querySelector('.novo .evo-select__box').click();
      ft.detectChanges();
      await ft.whenStable();
      expect(document.querySelectorAll('.custom').length).toBe(4);
      expect(document.querySelector('.custom')!.closest('[role=option]')).not.toBeNull();
      expect(document.querySelector('.evo-select__check')).toBeNull();

      ft.nativeElement.querySelector('.legado .evo-select__box').click();
      ft.detectChanges();
      await ft.whenStable();
      const legado = [...document.querySelectorAll('.legado-item')].map((e) => e.textContent);
      expect(legado).toContain('Manga!');
      ft.destroy();
    });
  });

  describe('provideEvoSelectMessages', () => {
    it('sobrepõe os textos', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Anfitriao],
        providers: [provideEvoSelectMessages({ placeholder: 'Escolha…', noResults: 'Nada.' })],
      }).compileComponents();
      const f = TestBed.createComponent(Anfitriao);
      f.componentInstance.pesquisavel.set(true);
      f.detectChanges();
      await f.whenStable();
      const h: HTMLElement = f.nativeElement.querySelector('evo-select');
      expect(h.querySelector('.evo-select__trigger')!.textContent).toContain('Escolha…');

      h.querySelector<HTMLElement>('.evo-select__box')!.click();
      f.detectChanges();
      await f.whenStable();
      const campo = document.querySelector<HTMLInputElement>('.evo-select__search-input')!;
      campo.value = 'zzz';
      campo.dispatchEvent(new Event('input'));
      f.detectChanges();
      await f.whenStable();
      expect(document.querySelector('.evo-select__empty')!.textContent).toContain('Nada.');
      f.destroy();
    });
  });

  /** Regra 1 do CSS — ver button/evo-button.spec.ts para o porquê deste teste. */
  describe('regra 1: o CSS não declara os próprios tokens', () => {
    function cssDoComponente(): string {
      return [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .filter((css) => css.includes('evo-select__box'))
        .join('\n');
    }

    it('cada token dos metadados é consumido no CSS, e vice-versa', () => {
      const css = cssDoComponente();
      const noCss = new Set(
        [...css.matchAll(/var\(\s*--evo-(select-[a-z-]+)\s*,/g)].map((m) => m[1]),
      );
      const nosMetadados = new Set(evoSelectMeta.tokens.map((t) => t.name));
      expect([...noCss].sort()).toEqual([...nosMetadados].sort());
    });

    it('não declara nenhum --evo-select-*', () => {
      const declaracoes = [
        ...cssDoComponente().matchAll(/(^|[;{\s])(--evo-select-[a-z-]+)\s*:/g),
      ].map((m) => m[2]);
      expect(declaracoes).toEqual([]);
    });
  });
});
