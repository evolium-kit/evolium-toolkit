import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
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
