import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  EvoSelectOption,
  EvoSelectSearchFn,
  evoSelectDefaultSearch,
} from '../select/select-option';
import { EvoTextField } from './evo-text-field';
import { provideEvoTextFieldMessages } from './text-field.messages';
import { evoTextFieldMeta } from './text-field.tokens';

@Component({
  imports: [EvoTextField],
  template: `
    <evo-text-field
      [(value)]="valor"
      [label]="label()"
      [hint]="hint()"
      [type]="tipo()"
      [error]="erro()"
      [size]="size()"
      [disabled]="desactivado()"
      [readonly]="soLeitura()"
      [optional]="opcional()"
      [hideLabel]="esconderLabel()"
      [clearable]="limpavel()"
      [showCount]="contador()"
      [maxlength]="maximo()"
      autocomplete="email"
    >
      <svg slot="prefix" class="icone"></svg>
    </evo-text-field>
  `,
})
class Anfitriao {
  readonly valor = signal('');
  readonly label = signal('Email');
  readonly hint = signal('');
  readonly tipo = signal('text');
  readonly erro = signal<string | null>(null);
  readonly size = signal('md');
  readonly desactivado = signal(false);
  readonly soLeitura = signal(false);
  readonly opcional = signal(false);
  readonly esconderLabel = signal(false);
  readonly limpavel = signal(false);
  readonly contador = signal(false);
  readonly maximo = signal<number | undefined>(undefined);
}

@Component({
  imports: [EvoTextField, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <evo-text-field formControlName="nome" label="Nome" />
      <evo-text-field
        formControlName="senha"
        label="Senha"
        [errorMessages]="{ minlength: 'Curta.' }"
      />
      <evo-text-field formControlName="idade" label="Idade" type="number" />
    </form>
  `,
})
class AnfitriaoForm {
  readonly form = new FormGroup({
    nome: new FormControl('Ana', { nonNullable: true, validators: [Validators.required] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8)] }),
    idade: new FormControl<number | null>(null),
  });
}

describe('EvoTextField', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let a: Anfitriao;
  let host: HTMLElement;

  const campo = () => host.querySelector<HTMLInputElement>('.evo-text-field__control')!;
  const mensagem = () => host.querySelector('.evo-text-field__message')!;
  const actualizar = () => fixture.detectChanges();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    a = fixture.componentInstance;
    actualizar();
    host = fixture.nativeElement.querySelector('evo-text-field');
  });

  it('renderiza etiqueta ligada ao campo, dentro de evo-field, com a caixa evo-input', () => {
    const label = host.querySelector('label')!;
    expect(host.classList.contains('evo-text-field')).toBe(true);
    expect(host.querySelector('evo-field')).not.toBeNull();
    expect(host.querySelector('.evo-text-field__box')!.classList.contains('evo-input')).toBe(true);
    expect(label.textContent).toContain('Email');
    expect(label.getAttribute('for')).toBe(campo().id);
    expect(campo().id).toMatch(/^evo-text-field-\d+$/);
  });

  it('sem label, não desenha a etiqueta', () => {
    a.label.set('');
    actualizar();
    expect(host.querySelector('label')).toBeNull();
  });

  it('projecta o ícone no prefixo', () => {
    expect(host.querySelector('.evo-text-field__prefix .icone')).not.toBeNull();
  });

  it('[(value)]: escrever actualiza o pai, e o pai actualiza o campo', () => {
    campo().value = 'ana@evolium.ao';
    campo().dispatchEvent(new Event('input'));
    expect(a.valor()).toBe('ana@evolium.ao');

    a.valor.set('outro@evolium.ao');
    actualizar();
    expect(campo().value).toBe('outro@evolium.ao');
  });

  it('passa os atributos nativos ao campo', () => {
    a.maximo.set(20);
    actualizar();
    expect(campo().getAttribute('autocomplete')).toBe('email');
    expect(campo().getAttribute('maxlength')).toBe('20');
  });

  it('size reflecte-se no host e na caixa', () => {
    a.size.set('lg');
    actualizar();
    expect(host.getAttribute('data-evo-size')).toBe('lg');
    expect(host.querySelector('.evo-text-field__box')!.getAttribute('data-evo-size')).toBe('lg');
  });

  it('hint é anunciado pelo aria-describedby', () => {
    a.hint.set('Nunca partilhamos.');
    actualizar();
    expect(mensagem().textContent).toContain('Nunca partilhamos.');
    expect(campo().getAttribute('aria-describedby')).toBe(mensagem().id);
  });

  it('erro manual: aria-invalid, data-evo-invalid, e não fica para trás ao sair', () => {
    a.hint.set('Ajuda');
    a.erro.set('Email inválido.');
    actualizar();
    expect(mensagem().textContent).toContain('Email inválido.');
    expect(mensagem().getAttribute('data-evo-tone')).toBe('error');
    expect(campo().getAttribute('aria-invalid')).toBe('true');
    expect(host.hasAttribute('data-evo-invalid')).toBe(true);

    a.erro.set(null);
    actualizar();
    expect(mensagem().textContent).toContain('Ajuda');
    expect(mensagem().hasAttribute('data-evo-tone')).toBe(false);
    expect(campo().hasAttribute('aria-invalid')).toBe(false);
    expect(host.hasAttribute('data-evo-invalid')).toBe(false);
  });

  it('a mensagem é uma região aria-live sempre presente', () => {
    expect(mensagem().getAttribute('aria-live')).toBe('polite');
    expect(campo().hasAttribute('aria-describedby')).toBe(false);
  });

  it('disabled e readonly chegam ao campo e ao host', () => {
    a.desactivado.set(true);
    a.soLeitura.set(true);
    actualizar();
    expect(campo().disabled).toBe(true);
    expect(campo().readOnly).toBe(true);
    expect(host.hasAttribute('data-evo-disabled')).toBe(true);
    expect(host.hasAttribute('data-evo-readonly')).toBe(true);

    a.desactivado.set(false);
    a.soLeitura.set(false);
    actualizar();
    expect(host.hasAttribute('data-evo-disabled')).toBe(false);
    expect(host.hasAttribute('data-evo-readonly')).toBe(false);
  });

  it('optional mostra "(opcional)"; hideLabel marca o host', () => {
    a.opcional.set(true);
    a.esconderLabel.set(true);
    actualizar();
    expect(host.querySelector('.evo-text-field__optional')!.textContent).toContain('(opcional)');
    expect(host.hasAttribute('data-evo-hide-label')).toBe(true);
  });

  it('textarea troca o elemento', () => {
    a.tipo.set('textarea');
    actualizar();
    expect(campo().tagName).toBe('TEXTAREA');
  });

  it('senha: o botão alterna o tipo e o aria-pressed', () => {
    a.tipo.set('password');
    actualizar();
    const botao = host.querySelector<HTMLButtonElement>('.evo-text-field__toggle')!;
    expect(campo().type).toBe('password');
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    expect(botao.getAttribute('aria-label')).toBe('Mostrar senha');

    botao.click();
    actualizar();
    expect(campo().type).toBe('text');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(botao.getAttribute('aria-label')).toBe('Ocultar senha');
  });

  it('clearable: o botão só aparece com valor, e apaga-o', () => {
    a.limpavel.set(true);
    actualizar();
    expect(host.querySelector('.evo-text-field__clear')).toBeNull();

    a.valor.set('abc');
    actualizar();
    host.querySelector<HTMLButtonElement>('.evo-text-field__clear')!.click();
    actualizar();
    expect(a.valor()).toBe('');
    expect(host.querySelector('.evo-text-field__clear')).toBeNull();
  });

  it('showCount mostra o contador com o máximo e liga-o ao campo', () => {
    a.contador.set(true);
    a.maximo.set(10);
    a.valor.set('abc');
    actualizar();
    const contador = host.querySelector('.evo-text-field__counter')!;
    expect(contador.textContent!.replace(/\s/g, '')).toBe('3/10');
    expect(campo().getAttribute('aria-describedby')).toContain(contador.id);
  });

  describe('com Reactive Forms', () => {
    let ff: ComponentFixture<AnfitriaoForm>;
    let form: AnfitriaoForm['form'];
    const campos = () =>
      [...ff.nativeElement.querySelectorAll('.evo-text-field__control')] as HTMLInputElement[];
    const hosts = () => [...ff.nativeElement.querySelectorAll('evo-text-field')] as HTMLElement[];

    beforeEach(() => {
      ff = TestBed.createComponent(AnfitriaoForm);
      ff.detectChanges();
      form = ff.componentInstance.form;
    });

    it('lê o valor inicial e o setValue do controlo', () => {
      expect(campos()[0].value).toBe('Ana');
      form.controls.nome.setValue('Bruno');
      ff.detectChanges();
      expect(campos()[0].value).toBe('Bruno');
    });

    it('Validators.required dá asterisco e aria-required', () => {
      expect(hosts()[0].querySelector('.evo-text-field__required')).not.toBeNull();
      expect(campos()[0].getAttribute('aria-required')).toBe('true');
      expect(campos()[1].hasAttribute('aria-required')).toBe(false);
    });

    it('escrever não marca touched; sair do campo marca', () => {
      campos()[0].value = '';
      campos()[0].dispatchEvent(new Event('input'));
      expect(form.controls.nome.value).toBe('');
      expect(form.controls.nome.touched).toBe(false);

      campos()[0].dispatchEvent(new Event('blur'));
      expect(form.controls.nome.touched).toBe(true);
    });

    it('erro automático só depois de touched, com a mensagem por omissão', () => {
      form.controls.nome.setValue('');
      ff.detectChanges();
      expect(hosts()[0].hasAttribute('data-evo-invalid')).toBe(false);

      form.controls.nome.markAsTouched();
      ff.detectChanges();
      expect(hosts()[0].querySelector('.evo-text-field__message')!.textContent).toContain(
        'Campo obrigatório.',
      );
      expect(hosts()[0].hasAttribute('data-evo-invalid')).toBe(true);

      form.controls.nome.setValue('Ana');
      ff.detectChanges();
      expect(hosts()[0].hasAttribute('data-evo-invalid')).toBe(false);
    });

    it('errorMessages do campo tem prioridade sobre as omissões', () => {
      form.controls.senha.setValue('abc');
      form.controls.senha.markAsTouched();
      ff.detectChanges();
      expect(hosts()[1].querySelector('.evo-text-field__message')!.textContent).toContain('Curta.');
    });

    it('um erro com texto (ex.: vindo da API) mostra-se tal como vem', () => {
      form.controls.nome.setErrors({ servidor: 'Já existe um cliente com este nome.' });
      form.controls.nome.markAsTouched();
      ff.detectChanges();
      expect(hosts()[0].querySelector('.evo-text-field__message')!.textContent).toContain(
        'Já existe um cliente com este nome.',
      );
    });

    it('control.disable() desactiva de facto', () => {
      form.controls.nome.disable();
      ff.detectChanges();
      expect(campos()[0].disabled).toBe(true);
      form.controls.nome.enable();
      ff.detectChanges();
      expect(campos()[0].disabled).toBe(false);
    });

    it('type="number" entrega um número ao formulário', () => {
      campos()[2].value = '42';
      campos()[2].dispatchEvent(new Event('input'));
      expect(form.controls.idade.value).toBe(42);
      campos()[2].value = '';
      campos()[2].dispatchEvent(new Event('input'));
      expect(form.controls.idade.value).toBeNull();
    });
  });

  describe('provideEvoTextFieldMessages', () => {
    it('sobrepõe mensagens e junta as de erro às omissões', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AnfitriaoForm],
        providers: [provideEvoTextFieldMessages({ errors: { required: 'Obrigatório!' } })],
      }).compileComponents();
      const ff = TestBed.createComponent(AnfitriaoForm);
      ff.detectChanges();
      const form = ff.componentInstance.form;

      form.controls.nome.setValue('');
      form.controls.nome.markAsTouched();
      form.controls.senha.setValue('abc');
      form.controls.senha.markAsTouched();
      form.controls.idade.setErrors({ desconhecido: true });
      form.controls.idade.markAsTouched();
      ff.detectChanges();

      const msgs = [...ff.nativeElement.querySelectorAll('.evo-text-field__message')].map(
        (m: Element) => m.textContent!.trim(),
      );
      expect(msgs).toEqual(['Obrigatório!', 'Curta.', 'Valor inválido.']);
    });
  });

  /** Regra 1 do CSS — ver button/evo-button.spec.ts para o porquê deste teste. */
  describe('regra 1: o CSS não declara os próprios tokens', () => {
    function cssDoComponente(): string {
      return [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .filter((css) => css.includes('evo-text-field__box'))
        .join('\n');
    }

    it('cada token dos metadados é consumido no CSS, e vice-versa', () => {
      const css = cssDoComponente();
      const noCss = new Set(
        [...css.matchAll(/var\(--evo-(text-field-[a-z-]+),/g)].map((m) => m[1]),
      );
      const nosMetadados = new Set(evoTextFieldMeta.tokens.map((t) => t.name));
      expect([...noCss].sort()).toEqual([...nosMetadados].sort());
    });

    it('não declara nenhum --evo-text-field-*', () => {
      const declaracoes = [
        ...cssDoComponente().matchAll(/(^|[;{\s])(--evo-text-field-[a-z-]+)\s*:/g),
      ].map((m) => m[2]);
      expect(declaracoes).toEqual([]);
    });
  });
});

const PAISES: EvoSelectOption<string>[] = [
  { value: 'ao', label: 'Angola', sublabel: 'África' },
  { value: 'pt', label: 'Portugal' },
  { value: 'br', label: 'Brasil' },
  { value: 'mz', label: 'Moçambique', disabled: true },
];

@Component({
  imports: [EvoTextField],
  template: `
    <evo-text-field
      type="autoComplete"
      label="País"
      [(value)]="valor"
      [options]="opcoes()"
      [freeSolo]="livre()"
      [loading]="aCarregar()"
      [autoHighlight]="destaque()"
      [openOnFocus]="abrirAoFocar()"
      [clearable]="limpavel()"
      [disabled]="desactivado()"
      [readonly]="soLeitura()"
      [searchFn]="filtro()"
      (searchChange)="pesquisas.push($event)"
      (openedChange)="aberturas.push($event)"
    />
  `,
})
class AnfitriaoAuto {
  readonly valor = signal<string | null>(null);
  readonly opcoes = signal(PAISES);
  readonly livre = signal(false);
  readonly aCarregar = signal(false);
  readonly destaque = signal(false);
  readonly abrirAoFocar = signal(false);
  readonly limpavel = signal(false);
  readonly desactivado = signal(false);
  readonly soLeitura = signal(false);
  readonly filtro = signal<EvoSelectSearchFn | null>(evoSelectDefaultSearch);
  readonly pesquisas: string[] = [];
  readonly aberturas: boolean[] = [];
}

@Component({
  imports: [EvoTextField, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <evo-text-field
        formControlName="numero"
        label="Número"
        type="autoComplete"
        [options]="numeros()"
      />
    </form>
  `,
})
class AnfitriaoFormAuto {
  readonly numeros = signal<EvoSelectOption<number>[]>([]);
  readonly form = new FormGroup({
    numero: new FormControl<number | null>(2, Validators.required),
  });
}

describe('EvoTextField · type="autoComplete"', () => {
  let fixture: ComponentFixture<AnfitriaoAuto>;
  let a: AnfitriaoAuto;
  let host: HTMLElement;

  const campo = () => host.querySelector<HTMLInputElement>('.evo-text-field__control')!;
  const opcoes = () => [...document.querySelectorAll<HTMLElement>('.evo-text-field__option')];
  const rotulos = () =>
    opcoes().map((o) => o.querySelector('.evo-text-field__option-label')!.textContent);
  const lista = () => document.querySelector<HTMLElement>('.evo-text-field__list');
  const seta = () => host.querySelector<HTMLButtonElement>('.evo-text-field__caret')!;
  const actualizar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** O ListKeyManager do CDK lê `keyCode`; o componente lê `key`. O browser dá os dois. */
  const CODIGOS: Record<string, number> = {
    Enter: 13,
    Escape: 27,
    Tab: 9,
    ArrowUp: 38,
    ArrowDown: 40,
  };
  const tecla = async (key: string) => {
    const evento = new KeyboardEvent('keydown', {
      key,
      keyCode: CODIGOS[key],
      bubbles: true,
      cancelable: true,
    });
    campo().dispatchEvent(evento);
    await actualizar();
    return evento;
  };
  const premir = async () => {
    campo().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await actualizar();
  };
  const escrever = async (texto: string) => {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    await actualizar();
  };
  const sair = async () => {
    campo().dispatchEvent(new Event('blur'));
    await actualizar();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AnfitriaoAuto] }).compileComponents();
    fixture = TestBed.createComponent(AnfitriaoAuto);
    a = fixture.componentInstance;
    await actualizar();
    host = fixture.nativeElement.querySelector('evo-text-field');
  });

  afterEach(() => fixture?.destroy());

  it('o próprio <input> é o combobox, com o preenchimento do browser desligado', () => {
    expect(campo().tagName).toBe('INPUT');
    expect(campo().type).toBe('text');
    expect(campo().getAttribute('role')).toBe('combobox');
    expect(campo().getAttribute('aria-autocomplete')).toBe('list');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(campo().getAttribute('autocomplete')).toBe('off');
    expect(host.querySelector('label')!.getAttribute('for')).toBe(campo().id);
    // Sem gatilho: não há nenhum botão de combobox, só o do painel (fora do Tab).
    expect(host.querySelector('.evo-select__trigger')).toBeNull();
    expect(seta().getAttribute('tabindex')).toBe('-1');
  });

  it('fora do autoComplete nada disto aparece', async () => {
    const f = TestBed.createComponent(Anfitriao);
    f.detectChanges();
    const input = f.nativeElement.querySelector('.evo-text-field__control') as HTMLInputElement;
    expect(input.hasAttribute('role')).toBe(false);
    expect(input.hasAttribute('aria-expanded')).toBe(false);
    expect(f.nativeElement.querySelector('.evo-text-field__caret')).toBeNull();
    f.destroy();
  });

  it('aceita também "autocomplete" em minúsculas', async () => {
    const f = TestBed.createComponent(EvoTextField);
    f.componentRef.setInput('type', 'autocomplete');
    f.detectChanges();
    expect(f.nativeElement.querySelector('input').getAttribute('role')).toBe('combobox');
    f.destroy();
  });

  it('o rato abre o painel e liga-o ao campo; outro clique, com o campo vazio, fecha', async () => {
    await premir();
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(host.hasAttribute('data-evo-open')).toBe(true);
    expect(lista()!.getAttribute('role')).toBe('listbox');
    expect(campo().getAttribute('aria-controls')).toBe(lista()!.id);
    expect(rotulos()).toEqual(['Angola', 'Portugal', 'Brasil', 'Moçambique']);
    expect(opcoes().every((o) => o.getAttribute('role') === 'option')).toBe(true);
    expect(a.aberturas).toEqual([true]);

    await premir();
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(campo().hasAttribute('aria-controls')).toBe(false);
    expect(lista()).toBeNull();
    expect(a.aberturas).toEqual([true, false]);
  });

  it('escrever abre, filtra sem distinguir acentos, e não destaca nada', async () => {
    await escrever('mocamb');
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(rotulos()).toEqual(['Moçambique']);
    expect(campo().hasAttribute('aria-activedescendant')).toBe(false);
    expect(opcoes().some((o) => o.hasAttribute('data-evo-active'))).toBe(false);
    expect(a.pesquisas).toEqual(['mocamb']);

    await escrever('POR');
    expect(rotulos()).toEqual(['Portugal']);
  });

  it('o sublabel também conta para o filtro', async () => {
    await escrever('áfric');
    expect(rotulos()).toEqual(['Angola']);
  });

  it('autoHighlight destaca a primeira opção a cada tecla', async () => {
    a.destaque.set(true);
    await actualizar();
    await escrever('br');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
    expect(opcoes()[0].hasAttribute('data-evo-active')).toBe(true);
  });

  it('↓ com o painel fechado abre-o e destaca a primeira; as setas percorrem e dão a volta', async () => {
    await tecla('ArrowDown');
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);

    await tecla('ArrowDown');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[1].id);
    await tecla('ArrowDown');
    // A quarta (Moçambique) está desactivada: salta-se, e dá a volta à primeira.
    await tecla('ArrowDown');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[0].id);
    await tecla('ArrowUp');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[2].id);
  });

  it('↑ com o painel fechado abre-o e destaca a última opção escolhível', async () => {
    await tecla('ArrowUp');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[2].id);
  });

  it('Enter escolhe a opção destacada: actualiza [(value)], mostra o nome e fecha', async () => {
    await tecla('ArrowDown');
    await tecla('ArrowDown');
    const enter = await tecla('Enter');
    expect(enter.defaultPrevented).toBe(true);
    expect(a.valor()).toBe('pt');
    expect(campo().value).toBe('Portugal');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(lista()).toBeNull();
  });

  it('Enter sem opção destacada não escolhe nem trava o envio do formulário', async () => {
    await escrever('por');
    const enter = await tecla('Enter');
    expect(enter.defaultPrevented).toBe(false);
    expect(a.valor()).toBeNull();
    expect(campo().getAttribute('aria-expanded')).toBe('true');
  });

  it('um clique numa opção escolhe-a; uma desactivada não', async () => {
    await premir();
    opcoes()[3].click();
    await actualizar();
    expect(a.valor()).toBeNull();
    expect(campo().getAttribute('aria-expanded')).toBe('true');

    opcoes()[2].click();
    await actualizar();
    expect(a.valor()).toBe('br');
    expect(campo().value).toBe('Brasil');
  });

  it('o rato destaca ao passar por cima, e a lista não rouba o foco ao campo', async () => {
    await premir();
    opcoes()[1].dispatchEvent(new Event('pointerenter'));
    await actualizar();
    expect(campo().getAttribute('aria-activedescendant')).toBe(opcoes()[1].id);

    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    lista()!.dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
  });

  it('reabrir com uma escolha mostra todas as opções e destaca a escolhida', async () => {
    await escrever('port');
    opcoes()[0].click();
    await actualizar();
    expect(campo().value).toBe('Portugal');

    await tecla('ArrowDown');
    expect(rotulos()).toEqual(['Angola', 'Portugal', 'Brasil', 'Moçambique']);
    const escolhida = opcoes().find((o) => o.getAttribute('aria-selected') === 'true')!;
    expect(escolhida.textContent).toContain('Portugal');
    expect(campo().getAttribute('aria-activedescendant')).toBe(escolhida.id);
  });

  it('mudar o texto de uma escolha volta a filtrar', async () => {
    await tecla('ArrowDown');
    await tecla('Enter');
    await escrever('bra');
    expect(rotulos()).toEqual(['Brasil']);
  });

  it('texto que não chegou a ser escolha volta ao valor ao sair do campo', async () => {
    await tecla('ArrowDown');
    await tecla('ArrowDown');
    await tecla('Enter');
    await escrever('xx');
    expect(campo().value).toBe('xx');
    expect(a.valor()).toBe('pt');

    await sair();
    expect(campo().value).toBe('Portugal');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  it('sem valor, texto solto fica vazio ao sair', async () => {
    await escrever('xx');
    await sair();
    expect(campo().value).toBe('');
    expect(a.valor()).toBeNull();
  });

  it('apagar todo o texto limpa o valor logo, sem esperar pelo blur, e não abre o painel', async () => {
    await tecla('ArrowDown');
    await tecla('Enter');
    expect(a.valor()).toBe('ao');

    await escrever('');
    expect(a.valor()).toBeNull();
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  it('Escape fecha o painel; com ele fechado, não faz nada; Tab também fecha', async () => {
    await premir();
    const primeiro = await tecla('Escape');
    expect(primeiro.defaultPrevented).toBe(true);
    expect(campo().getAttribute('aria-expanded')).toBe('false');

    const segundo = await tecla('Escape');
    expect(segundo.defaultPrevented).toBe(false);

    await premir();
    await tecla('Tab');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  it('sem correspondência mostra "Nenhuma opção encontrada"', async () => {
    await escrever('zzzz');
    expect(opcoes().length).toBe(0);
    expect(document.querySelector('.evo-text-field__empty')!.textContent).toContain(
      'Nenhuma opção encontrada',
    );
  });

  it('com loading e sem opções mostra "A carregar…" e marca o aria-busy', async () => {
    a.opcoes.set([]);
    a.aCarregar.set(true);
    await actualizar();
    await premir();
    expect(document.querySelector('.evo-text-field__empty')!.textContent).toContain('A carregar…');
    expect(campo().getAttribute('aria-busy')).toBe('true');
    expect(lista()!.getAttribute('aria-busy')).toBe('true');
    expect(host.hasAttribute('data-evo-loading')).toBe(true);
    expect(host.querySelector('.evo-text-field__spinner')).not.toBeNull();
  });

  it('openOnFocus abre ao receber o foco', async () => {
    a.abrirAoFocar.set(true);
    await actualizar();
    campo().dispatchEvent(new Event('focus'));
    await actualizar();
    expect(campo().getAttribute('aria-expanded')).toBe('true');
  });

  it('desactivado ou só de leitura nunca abre', async () => {
    a.desactivado.set(true);
    await actualizar();
    await premir();
    await tecla('ArrowDown');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(seta().disabled).toBe(true);

    a.desactivado.set(false);
    a.soLeitura.set(true);
    await actualizar();
    await premir();
    await tecla('ArrowDown');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(seta().disabled).toBe(true);
  });

  it('desactivar com o painel aberto fecha-o', async () => {
    await premir();
    expect(lista()).not.toBeNull();
    a.desactivado.set(true);
    await actualizar();
    expect(lista()).toBeNull();
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(a.aberturas).toEqual([true, false]);
  });

  it('a seta abre e fecha o painel, com o nome acessível certo', async () => {
    expect(seta().getAttribute('aria-label')).toBe('Abrir opções');
    seta().click();
    await actualizar();
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(seta().getAttribute('aria-label')).toBe('Fechar opções');
    expect(seta().getAttribute('aria-expanded')).toBe('true');

    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    seta().dispatchEvent(mousedown);
    // Sem isto, o clique na seta tirava o foco ao campo e o painel fechava logo.
    expect(mousedown.defaultPrevented).toBe(true);

    seta().click();
    await actualizar();
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  it('clearable: o × apaga o texto e o valor (null), e fecha o painel', async () => {
    a.limpavel.set(true);
    await actualizar();
    expect(host.querySelector('.evo-text-field__clear')).toBeNull();

    await tecla('ArrowDown');
    await tecla('Enter');
    expect(a.valor()).toBe('ao');

    host.querySelector<HTMLButtonElement>('.evo-text-field__clear')!.click();
    await actualizar();
    expect(a.valor()).toBeNull();
    expect(campo().value).toBe('');
    expect(host.querySelector('.evo-text-field__clear')).toBeNull();
    expect(campo().getAttribute('aria-expanded')).toBe('false');
  });

  it('opções que chegam a meio da escrita (pesquisa no servidor) não apagam o texto', async () => {
    a.filtro.set(null);
    await actualizar();
    await escrever('an');
    expect(a.pesquisas).toEqual(['an']);

    a.opcoes.set([PAISES[0]]);
    await actualizar();
    expect(campo().value).toBe('an');
    // E com `searchFn` nulo o filtro local está desligado: ficam as que o pai deu.
    expect(rotulos()).toEqual(['Angola']);
  });

  it('um valor sem opção correspondente mostra-se tal como é, e passa a nome quando a opção chega', async () => {
    a.opcoes.set([]);
    a.valor.set('pt');
    await actualizar();
    expect(campo().value).toBe('pt');

    a.opcoes.set(PAISES);
    await actualizar();
    expect(campo().value).toBe('Portugal');
  });

  it('o pai muda o valor e o texto acompanha', async () => {
    a.valor.set('br');
    await actualizar();
    expect(campo().value).toBe('Brasil');
    a.valor.set(null);
    await actualizar();
    expect(campo().value).toBe('');
  });

  describe('freeSolo', () => {
    beforeEach(async () => {
      a.livre.set(true);
      await actualizar();
    });

    it('o valor é o texto escrito, a cada tecla', async () => {
      await escrever('Cabinda');
      expect(a.valor()).toBe('Cabinda');
      expect(campo().value).toBe('Cabinda');
    });

    it('sem sugestões não há painel nem "sem resultados"', async () => {
      await escrever('zzzz');
      expect(lista()).toBeNull();
      expect(campo().getAttribute('aria-expanded')).toBe('false');
      expect(a.aberturas).toEqual([true]);

      // Reaparece quando o texto volta a ter sugestões.
      await escrever('ang');
      expect(rotulos()).toEqual(['Angola']);
      expect(campo().getAttribute('aria-expanded')).toBe('true');
    });

    it('Enter fecha e fica com o texto, sem enviar o formulário', async () => {
      await escrever('ang');
      const enter = await tecla('Enter');
      expect(enter.defaultPrevented).toBe(true);
      expect(a.valor()).toBe('ang');
      expect(campo().getAttribute('aria-expanded')).toBe('false');
    });

    it('sair do campo mantém o texto', async () => {
      await escrever('Cabinda');
      await sair();
      expect(campo().value).toBe('Cabinda');
      expect(a.valor()).toBe('Cabinda');
    });

    it('escolher uma opção dá o seu value, e o × limpa para texto vazio', async () => {
      a.limpavel.set(true);
      await actualizar();
      await escrever('ang');
      opcoes()[0].click();
      await actualizar();
      expect(a.valor()).toBe('ao');
      expect(campo().value).toBe('Angola');

      host.querySelector<HTMLButtonElement>('.evo-text-field__clear')!.click();
      await actualizar();
      expect(a.valor()).toBe('');
    });
  });

  describe('com Reactive Forms', () => {
    let ff: ComponentFixture<AnfitriaoFormAuto>;
    let form: AnfitriaoFormAuto['form'];
    const input = () =>
      ff.nativeElement.querySelector('.evo-text-field__control') as HTMLInputElement;
    const refrescar = async () => {
      ff.detectChanges();
      await ff.whenStable();
    };

    beforeEach(async () => {
      ff = TestBed.createComponent(AnfitriaoFormAuto);
      form = ff.componentInstance.form;
      await refrescar();
    });

    afterEach(() => ff?.destroy());

    it('o formulário recebe o value da opção (um número), e não o texto', async () => {
      ff.componentInstance.numeros.set([
        { value: 1, label: 'Um' },
        { value: 2, label: 'Dois' },
      ]);
      await refrescar();
      input().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await refrescar();
      const opcoes = [...document.querySelectorAll<HTMLElement>('.evo-text-field__option')];
      opcoes[0].click();
      await refrescar();
      expect(form.controls.numero.value).toBe(1);
      expect(input().value).toBe('Um');
    });

    it('o valor inicial vira nome quando as opções chegam depois', async () => {
      expect(input().value).toBe('2');
      ff.componentInstance.numeros.set([{ value: 2, label: 'Dois' }]);
      await refrescar();
      expect(input().value).toBe('Dois');
    });

    it('escrever não mexe no controlo; apagar o texto põe-no a null', async () => {
      ff.componentInstance.numeros.set([{ value: 2, label: 'Dois' }]);
      await refrescar();
      input().value = 'Do';
      input().dispatchEvent(new Event('input'));
      await refrescar();
      expect(form.controls.numero.value).toBe(2);

      input().value = '';
      input().dispatchEvent(new Event('input'));
      await refrescar();
      expect(form.controls.numero.value).toBeNull();
    });

    it('setValue para o mesmo valor apaga o texto escrito', async () => {
      ff.componentInstance.numeros.set([{ value: 2, label: 'Dois' }]);
      await refrescar();
      input().value = 'zz';
      input().dispatchEvent(new Event('input'));
      await refrescar();
      expect(input().value).toBe('zz');

      form.controls.numero.setValue(2);
      await refrescar();
      expect(input().value).toBe('Dois');
    });

    it('touched ao sair do campo, e o erro automático aparece', async () => {
      form.controls.numero.setValue(null);
      await refrescar();
      expect(form.controls.numero.touched).toBe(false);

      input().dispatchEvent(new Event('blur'));
      await refrescar();
      expect(form.controls.numero.touched).toBe(true);
      expect(ff.nativeElement.querySelector('.evo-text-field__message').textContent).toContain(
        'Campo obrigatório.',
      );
    });

    it('control.disable() desactiva o campo e a seta', async () => {
      form.controls.numero.disable();
      await refrescar();
      expect(input().disabled).toBe(true);
      expect(ff.nativeElement.querySelector('.evo-text-field__caret').disabled).toBe(true);
    });
  });
});
