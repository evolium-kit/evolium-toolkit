import { InteractivityChecker } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  TemplateRef,
  inject,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EVO_DRAWER_DATA, EvoDrawerRef, injectDrawerRef } from './drawer-ref';
import { EvoDrawerService, provideEvoDrawers } from './drawer.service';

@Component({
  template: `<p class="conteudo">Olá {{ dados.nome }}</p>
    <button class="gravar" (click)="gravar()">Gravar</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormPessoa {
  protected readonly dados = inject(EVO_DRAWER_DATA) as { nome: string };
  private readonly ref = injectDrawerRef<string, { gravado: { nome: string } }>();

  gravar(): void {
    this.ref.emit('gravado', { nome: this.dados.nome });
    this.ref.close(this.dados.nome.toUpperCase());
  }
}

@Component({
  template: `<ng-template #tpl let-dados let-ref="ref">
    <span class="tpl">{{ dados }}</span>
    <button class="tpl-fechar" (click)="ref.close('do-template')">x</button>
  </ng-template>`,
})
class ComTemplate {
  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
}

const esperar = () => new Promise((r) => setTimeout(r));

/**
 * O jsdom não tem layout: o InteractivityChecker do CDK vê tudo como
 * invisível e o focus trap cai no contentor. Este decide só pela marcação.
 */
const FOCAVEL =
  'button:not([disabled]), input:not([disabled]), a[href], textarea, select, [tabindex]';
const checkerSemLayout = {
  provide: InteractivityChecker,
  useValue: {
    isDisabled: (el: Element) => el.hasAttribute('disabled'),
    isVisible: () => true,
    isFocusable: (el: Element) => el.matches(FOCAVEL),
    isTabbable: (el: Element) => el.matches(FOCAVEL) && (el as HTMLElement).tabIndex >= 0,
  },
};
const todos = (sel: string) => [
  ...document.querySelectorAll<HTMLElement>(`.cdk-overlay-container ${sel}`),
];
const um = (sel: string) => document.querySelector<HTMLElement>(`.cdk-overlay-container ${sel}`);
const botoes = () => todos('.evo-drawer-container__actions button');
const dialogo = () => um('[role="dialog"]');

async function estabilizar(): Promise<void> {
  await esperar();
  TestBed.tick();
  await esperar();
}

describe('EvoDrawerService', () => {
  let drawers: EvoDrawerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [checkerSemLayout] });
    drawers = TestBed.inject(EvoDrawerService);
  });

  afterEach(() => drawers.closeAll());

  describe('open sem conteúdo', () => {
    it('mostra título e mensagem', async () => {
      const p = drawers.open({ title: 'Aviso', message: 'Linha 1' });
      await estabilizar();

      expect(um('.evo-drawer-panel__title')!.textContent).toContain('Aviso');
      expect(um('.evo-drawer-container__message')!.textContent).toContain('Linha 1');
      expect(botoes()).toEqual([]);

      drawers.close(p.id);
      await expect(p.closed).resolves.toBeUndefined();
      expect(um('evo-drawer-panel')).toBeNull();
    });
  });

  describe('acções', () => {
    it('fecha com o value da acção (não com a posição do botão)', async () => {
      const ref = drawers.open({
        message: 'Escolha',
        actions: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      });
      await estabilizar();
      botoes()[0].click();
      await expect(ref.closed).resolves.toBe('a');
      expect(ref.closeReason).toBe('action');
    });

    it('mostra loading durante o handler e fecha com o que ele devolve', async () => {
      let terminar!: (v: string) => void;
      const ref = drawers.open({
        message: 'Gravar?',
        actions: [
          { label: 'Cancelar', value: 'nao' },
          { label: 'Gravar', handler: () => new Promise<string>((r) => (terminar = r)) },
        ],
      });
      await estabilizar();
      botoes()[1].click();
      await estabilizar();
      expect(botoes()[1].getAttribute('aria-busy')).toBe('true');
      expect((botoes()[0] as HTMLButtonElement).disabled).toBe(true);

      terminar('gravado');
      await expect(ref.closed).resolves.toBe('gravado');
    });

    it('se o handler rejeitar, fica aberto e mostra o erro', async () => {
      const ref = drawers.open({
        message: 'Gravar?',
        actions: [{ label: 'Gravar', handler: () => Promise.reject(new Error('Sem ligação.')) }],
      });
      await estabilizar();
      botoes()[0].click();
      await estabilizar();
      expect(ref.isOpen()).toBe(true);
      expect(um('[role="alert"]')!.textContent).toContain('Sem ligação.');
    });

    it('closes: false não fecha', async () => {
      let cliques = 0;
      const ref = drawers.open({
        message: 'x',
        actions: [{ label: 'Mais', closes: false, handler: () => void cliques++ }],
      });
      await estabilizar();
      botoes()[0].click();
      await estabilizar();
      expect(cliques).toBe(1);
      expect(ref.isOpen()).toBe(true);
    });
  });

  describe('open com conteúdo', () => {
    it('entrega data e ref ao componente, com eventos tipados', async () => {
      const gravados: { nome: string }[] = [];
      const ref = drawers.open<{ nome: string }, string, { gravado: { nome: string } }>(
        FormPessoa,
        { title: 'Pessoa', data: { nome: 'Ana' }, on: { gravado: (p) => gravados.push(p) } },
      );
      await estabilizar();
      expect(um('.conteudo')!.textContent).toContain('Olá Ana');
      expect(botoes()).toEqual([]); // com componente, sem botões por omissão

      um('.gravar')!.click();
      await expect(ref.closed).resolves.toBe('ANA');
      expect(gravados).toEqual([{ nome: 'Ana' }]);
    });

    it('aceita um TemplateRef, com let-dados e let-ref', async () => {
      const f = TestBed.createComponent(ComTemplate);
      f.detectChanges();
      const ref = drawers.open(f.componentInstance.tpl(), { data: 'dados!' });
      await estabilizar();
      expect(um('.tpl')!.textContent).toBe('dados!');
      um('.tpl-fechar')!.click();
      await expect(ref.closed).resolves.toBe('do-template');
      f.destroy();
    });

    it('beforeClose trava o × mas não o close()', async () => {
      const ref = drawers.open(FormPessoa, { data: { nome: 'x' }, beforeClose: () => false });
      await estabilizar();
      um('.evo-drawer-panel__close')!.click();
      await estabilizar();
      expect(ref.isOpen()).toBe(true);
      await expect(ref.requestClose()).resolves.toBe(false);

      ref.close('forcado');
      await expect(ref.closed).resolves.toBe('forcado');
    });

    it('aplica config.tokens ao overlay', async () => {
      drawers.open({
        message: 'x',
        tokens: { 'drawer-width-md': '20rem', '--evo-drawer-bg': 'red' },
      });
      await estabilizar();
      const wrapper = document.querySelector<HTMLElement>('.cdk-global-overlay-wrapper')!;
      expect(wrapper.style.getPropertyValue('--evo-drawer-width-md')).toBe('20rem');
      expect(wrapper.style.getPropertyValue('--evo-drawer-bg')).toBe('red');
    });

    it('sem backdrop (backdrop: false) não há elemento de fundo', async () => {
      drawers.open({ message: 'x', backdrop: false });
      await estabilizar();
      expect(document.querySelector('.evo-drawer-backdrop')).toBeNull();
      expect(dialogo()).not.toBeNull();
    });
  });

  describe('gerir drawers abertos', () => {
    it('openDrawers, close(id) e closeAll()', async () => {
      const a = drawers.open({ id: 'a', message: 'a' });
      const b = drawers.open({ id: 'b', message: 'b' });
      expect(drawers.openDrawers().map((r) => r.id)).toEqual(['a', 'b']);
      await estabilizar();

      expect(drawers.close('a')).toBe(true);
      await expect(a.closed).resolves.toBeUndefined();
      expect(drawers.openDrawers().map((r) => r.id)).toEqual(['b']);
      expect(drawers.close('nao-existe')).toBe(false);

      drawers.closeAll();
      await b.closed;
      expect(drawers.openDrawers()).toEqual([]);
    });

    it('abrir com um id já aberto devolve o mesmo', () => {
      const a = drawers.open({ id: 'unico', message: 'a' });
      expect(drawers.open({ id: 'unico', message: 'b' })).toBe(a);
      expect(drawers.openDrawers()).toHaveLength(1);
    });

    it('com dois drawers, o Escape fecha só o de cima', async () => {
      const a = drawers.open({ message: 'a' });
      const b = drawers.open({ message: 'b' });
      await estabilizar();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await estabilizar();
      expect(b.isOpen()).toBe(false);
      expect(a.isOpen()).toBe(true);
    });
  });
});

describe('EvoDrawerService no servidor', () => {
  it('não abre nada e devolve uma referência já fechada', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const drawers = TestBed.inject(EvoDrawerService);
    const ref = drawers.open({ message: 'x' });
    expect(ref.isOpen()).toBe(false);
    await expect(ref.closed).resolves.toBeUndefined();
    expect(document.querySelector('evo-drawer-panel')).toBeNull();
  });
});

describe('EvoDrawerService com fragmento da URL', () => {
  let router: Router;
  let drawers: EvoDrawerService;

  @Component({ template: '' })
  class Pagina {}

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        checkerSemLayout,
        provideLocationMocks(),
        provideRouter([{ path: 'motoristas', component: Pagina }]),
        provideEvoDrawers({
          fragments: { registar: (d) => d.open({ title: 'Registar', message: 'form' }) },
        }),
      ],
    });
    router = TestBed.inject(Router);
    drawers = TestBed.inject(EvoDrawerService);
    router.initialNavigation();
    await router.navigateByUrl('/motoristas');
  });

  afterEach(() => drawers.closeAll());

  it('abrir com fragment põe-no na URL; fechar tira-o', async () => {
    const ref = drawers.open({ message: 'x', fragment: 'editar' });
    await estabilizar();
    expect(router.url).toBe('/motoristas#editar');
    expect(ref.fragment).toBe('editar');

    ref.close();
    for (let i = 0; i < 50 && router.url.includes('#'); i++) await esperar();
    expect(router.url).toBe('/motoristas');
  });

  it('o botão Voltar fecha o drawer, sem recuar outra vez no histórico', async () => {
    const ref = drawers.open({ message: 'x', fragment: 'editar' });
    await estabilizar();
    TestBed.inject(Location).back();
    for (let i = 0; i < 50 && ref.isOpen(); i++) await esperar();
    await estabilizar();
    expect(ref.isOpen()).toBe(false);
    expect(ref.closeReason).toBe('navigation');
    expect(router.url).toBe('/motoristas');
  });

  it('um fragmento registado abre o drawer ao navegar para ele (ex.: ao recarregar)', async () => {
    await router.navigateByUrl('/motoristas#registar');
    await estabilizar();
    const ref = drawers.openDrawers()[0];
    expect(ref).toBeDefined();
    expect(ref.fragment).toBe('registar');
    expect(um('.evo-drawer-panel__title')!.textContent).toContain('Registar');
  });
});
