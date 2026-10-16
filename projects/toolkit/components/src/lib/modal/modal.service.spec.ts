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
import { EVO_MODAL_DATA, EvoModalRef, injectModalRef } from './modal-ref';
import { EvoModalService, provideEvoModals } from './modal.service';

@Component({
  template: `<p class="conteudo">Olá {{ dados.nome }}</p>
    <button class="gravar" (click)="gravar()">Gravar</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormPessoa {
  protected readonly dados = inject(EVO_MODAL_DATA) as { nome: string };
  private readonly ref = injectModalRef<string, { gravado: { nome: string } }>();

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
const botoes = () => todos('.evo-modal-panel__footer button');
const dialogo = () => um('[role="dialog"]');

async function estabilizar(): Promise<void> {
  await esperar();
  TestBed.tick();
  await esperar();
}

describe('EvoModalService', () => {
  let modals: EvoModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [checkerSemLayout] });
    modals = TestBed.inject(EvoModalService);
  });

  afterEach(() => modals.closeAll());

  describe('alert e atalhos', () => {
    it('mostra título, mensagem e um botão OK; resolve ao clicar', async () => {
      const p = modals.alert({ title: 'Aviso', message: 'Linha 1' });
      await estabilizar();

      expect(um('.evo-modal-panel__title')!.textContent).toContain('Aviso');
      const msg = um('.evo-modal-container__message')!;
      expect(msg.textContent).toContain('Linha 1');
      expect(dialogo()!.getAttribute('aria-describedby')).toBe(msg.id);
      expect(dialogo()!.getAttribute('aria-labelledby')).toBe(um('.evo-modal-panel__title')!.id);
      expect(botoes().map((b) => b.textContent!.trim())).toEqual(['OK']);

      botoes()[0].click();
      await expect(p).resolves.toBeUndefined();
      expect(um('evo-modal-panel')).toBeNull();
    });

    it('success() mostra o título por omissão e o tom (corrige o título que nunca aparecia)', async () => {
      void modals.success('Pagamento aceite.');
      await estabilizar();
      expect(um('.evo-modal-panel__title')!.textContent).toContain('Sucesso');
      expect(um('evo-modal-panel')!.getAttribute('data-evo-tone')).toBe('success');
      expect(um('.evo-modal-panel__tone-icon')).not.toBeNull();
    });

    it('error(), warning() e info() usam o tom certo', async () => {
      void modals.error('x');
      void modals.warning('y');
      void modals.info('z');
      await estabilizar();
      expect(todos('evo-modal-panel').map((p) => p.getAttribute('data-evo-tone'))).toEqual([
        'danger',
        'warning',
        'info',
      ]);
    });

    it('o foco começa no botão', async () => {
      void modals.info('Olá');
      await estabilizar();
      await esperar();
      expect(document.activeElement).toBe(botoes()[0]);
    });
  });

  describe('confirm', () => {
    it('resolve true ao confirmar', async () => {
      const p = modals.confirm('Continuar?');
      await estabilizar();
      expect(botoes().map((b) => b.textContent!.trim())).toEqual(['Cancelar', 'Confirmar']);
      expect(um('evo-modal-panel')!.getAttribute('data-evo-tone')).toBe('question');
      botoes()[1].click();
      await expect(p).resolves.toBe(true);
    });

    it('resolve false ao cancelar, no Escape e no fundo', async () => {
      const p1 = modals.confirm('a');
      await estabilizar();
      botoes()[0].click();
      await expect(p1).resolves.toBe(false);

      const p2 = modals.confirm('b');
      await estabilizar();
      dialogo()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await expect(p2).resolves.toBe(false);

      const p3 = modals.confirm('c');
      await estabilizar();
      document.querySelector<HTMLElement>('.evo-modal-backdrop')!.click();
      await expect(p3).resolves.toBe(false);
    });

    it('com tone danger, o botão é danger e o foco começa em Cancelar', async () => {
      void modals.confirm({ message: 'Eliminar?', tone: 'danger', confirmLabel: 'Eliminar' });
      await estabilizar();
      await esperar();
      expect(botoes()[1].getAttribute('data-evo-variant')).toBe('danger');
      expect(botoes()[1].textContent!.trim()).toBe('Eliminar');
      expect(document.activeElement).toBe(botoes()[0]);
    });
  });

  describe('acções', () => {
    it('fecha com o value da acção (não com a posição do botão)', async () => {
      const ref = modals.open({
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
      const ref = modals.open({
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
      const ref = modals.open({
        message: 'Gravar?',
        actions: [
          {
            label: 'Gravar',
            handler: () => Promise.reject(new Error('Sem ligação.')),
          },
        ],
      });
      await estabilizar();
      botoes()[0].click();
      await estabilizar();
      expect(ref.isOpen()).toBe(true);
      expect(um('[role="alert"]')!.textContent).toContain('Sem ligação.');
      expect(botoes()[0].hasAttribute('aria-busy')).toBe(false);
    });

    it('um erro sem mensagem mostra o texto por omissão', async () => {
      modals.open({
        message: 'x',
        actions: [{ label: 'Ir', handler: () => Promise.reject(null) }],
      });
      await estabilizar();
      botoes()[0].click();
      await estabilizar();
      expect(um('[role="alert"]')!.textContent).toContain('Não foi possível concluir a operação.');
    });

    it('closes: false não fecha', async () => {
      let cliques = 0;
      const ref = modals.open({
        message: 'x',
        actions: [{ label: 'Mais', closes: false, handler: () => void cliques++ }],
      });
      await estabilizar();
      botoes()[0].click();
      await estabilizar();
      expect(cliques).toBe(1);
      expect(ref.isOpen()).toBe(true);
    });

    it('actions: [] tira o rodapé', async () => {
      modals.open({ message: 'x', actions: [] });
      await estabilizar();
      expect(botoes()).toEqual([]);
    });
  });

  describe('open com conteúdo', () => {
    it('entrega data e ref ao componente, com eventos tipados', async () => {
      const gravados: { nome: string }[] = [];
      const ref = modals.open<{ nome: string }, string, { gravado: { nome: string } }>(FormPessoa, {
        title: 'Pessoa',
        data: { nome: 'Ana' },
        on: { gravado: (p) => gravados.push(p) },
      });
      await estabilizar();
      expect(um('.conteudo')!.textContent).toContain('Olá Ana');
      expect(botoes()).toEqual([]); // com componente, sem botões por omissão

      um('.gravar')!.click();
      await expect(ref.closed).resolves.toBe('ANA');
      expect(gravados).toEqual([{ nome: 'Ana' }]);
    });

    it('o foco vai para o primeiro elemento do conteúdo', async () => {
      modals.open(FormPessoa, { data: { nome: 'Rui' } });
      await estabilizar();
      await esperar();
      // O × vem depois do conteúdo no DOM.
      expect(document.activeElement).toBe(um('.gravar'));
    });

    it('aceita um TemplateRef, com let-dados e let-ref', async () => {
      const f = TestBed.createComponent(ComTemplate);
      f.detectChanges();
      const ref = modals.open(f.componentInstance.tpl(), { data: 'dados!' });
      await estabilizar();
      expect(um('.tpl')!.textContent).toBe('dados!');
      um('.tpl-fechar')!.click();
      await expect(ref.closed).resolves.toBe('do-template');
      f.destroy();
    });

    it('beforeClose trava o × mas não o close()', async () => {
      const ref = modals.open(FormPessoa, { data: { nome: 'x' }, beforeClose: () => false });
      await estabilizar();
      um('.evo-modal-panel__close')!.click();
      await estabilizar();
      expect(ref.isOpen()).toBe(true);
      await expect(ref.requestClose()).resolves.toBe(false);

      ref.close('forcado');
      await expect(ref.closed).resolves.toBe('forcado');
    });

    it('aplica config.tokens ao overlay', async () => {
      modals.open({ message: 'x', tokens: { 'modal-radius': '0px', '--evo-modal-bg': 'red' } });
      await estabilizar();
      const wrapper = document.querySelector<HTMLElement>('.cdk-global-overlay-wrapper')!;
      expect(wrapper.style.getPropertyValue('--evo-modal-radius')).toBe('0px');
      expect(wrapper.style.getPropertyValue('--evo-modal-bg')).toBe('red');
    });
  });

  describe('prompt', () => {
    it('devolve o texto ao confirmar e null ao cancelar', async () => {
      const p = modals.prompt({ title: 'Nome', label: 'Nome', value: 'Ana' });
      await estabilizar();
      const input = um('input')!;
      expect((input as HTMLInputElement).value).toBe('Ana');
      botoes()[1].click();
      await expect(p).resolves.toBe('Ana');

      const p2 = modals.prompt({ title: 'Nome' });
      await estabilizar();
      botoes()[0].click();
      await expect(p2).resolves.toBeNull();
    });

    it('required impede confirmar com o campo vazio', async () => {
      void modals.prompt({ title: 'Motivo', required: true });
      await estabilizar();
      expect((botoes()[1] as HTMLButtonElement).disabled).toBe(true);

      const input = um('input') as HTMLInputElement;
      input.value = 'porque sim';
      input.dispatchEvent(new Event('input'));
      await estabilizar();
      expect((botoes()[1] as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('gerir modais abertos', () => {
    it('openModals, close(id) e closeAll()', async () => {
      const a = modals.open({ id: 'a', message: 'a' });
      const b = modals.open({ id: 'b', message: 'b' });
      expect(modals.openModals().map((r) => r.id)).toEqual(['a', 'b']);
      await estabilizar();

      expect(modals.close('a')).toBe(true);
      await expect(a.closed).resolves.toBeUndefined();
      expect(modals.openModals().map((r) => r.id)).toEqual(['b']);
      expect(modals.close('nao-existe')).toBe(false);

      modals.closeAll();
      await b.closed;
      expect(modals.openModals()).toEqual([]);
    });

    it('abrir com um id já aberto devolve o mesmo', () => {
      const a = modals.open({ id: 'unico', message: 'a' });
      expect(modals.open({ id: 'unico', message: 'b' })).toBe(a);
      expect(modals.openModals()).toHaveLength(1);
    });

    it('com dois modais, o Escape fecha só o de cima', async () => {
      const a = modals.open({ message: 'a' });
      const b = modals.open({ message: 'b' });
      await estabilizar();
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await estabilizar();
      expect(b.isOpen()).toBe(false);
      expect(a.isOpen()).toBe(true);
    });
  });
});

describe('EvoModalService no servidor', () => {
  it('não abre nada e devolve uma referência já fechada', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const modals = TestBed.inject(EvoModalService);
    const ref = modals.open({ message: 'x' });
    expect(ref.isOpen()).toBe(false);
    await expect(ref.closed).resolves.toBeUndefined();
    await expect(modals.confirm('?')).resolves.toBe(false);
    expect(document.querySelector('evo-modal-panel')).toBeNull();
  });
});

describe('EvoModalService com fragmento da URL', () => {
  let router: Router;
  let modals: EvoModalService;

  @Component({ template: '' })
  class Pagina {}

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        checkerSemLayout,
        provideLocationMocks(),
        provideRouter([{ path: 'motoristas', component: Pagina }]),
        provideEvoModals({
          fragments: { registar: (m) => m.open({ title: 'Registar', message: 'form' }) },
        }),
      ],
    });
    router = TestBed.inject(Router);
    modals = TestBed.inject(EvoModalService);
    // Sem bootstrap ninguém chama isto, e o router nunca ouviria o popstate
    // (botão Voltar, location.back()).
    router.initialNavigation();
    await router.navigateByUrl('/motoristas');
  });

  afterEach(() => modals.closeAll());

  it('abrir com fragment põe-no na URL; fechar tira-o', async () => {
    const ref = modals.open({ message: 'x', fragment: 'editar' });
    await estabilizar();
    expect(router.url).toBe('/motoristas#editar');
    expect(ref.fragment).toBe('editar');

    ref.close();
    // Foi o modal que pôs o fragmento: sai por location.back(), que no
    // browser (e no jsdom) só chega no popstate seguinte.
    for (let i = 0; i < 50 && router.url.includes('#'); i++) await esperar();
    expect(router.url).toBe('/motoristas');
  });

  it('o botão Voltar fecha o modal, sem recuar outra vez no histórico', async () => {
    const ref = modals.open({ message: 'x', fragment: 'editar' });
    await estabilizar();
    TestBed.inject(Location).back();
    for (let i = 0; i < 50 && ref.isOpen(); i++) await esperar();
    await estabilizar();
    expect(ref.isOpen()).toBe(false);
    expect(ref.closeReason).toBe('navigation');
    expect(router.url).toBe('/motoristas');
  });

  it('navegar para fora do fragmento fecha o modal', async () => {
    const ref = modals.open({ message: 'x', fragment: 'editar' });
    await estabilizar();
    await router.navigateByUrl('/motoristas');
    expect(ref.isOpen()).toBe(false);
    expect(ref.closeReason).toBe('navigation');
  });

  it('um fragmento registado abre o modal ao navegar para ele (ex.: ao recarregar)', async () => {
    await router.navigateByUrl('/motoristas#registar');
    await estabilizar();
    const ref = modals.openModals()[0];
    expect(ref).toBeDefined();
    expect(ref.fragment).toBe('registar');
    expect(um('.evo-modal-panel__title')!.textContent).toContain('Registar');
  });

  it('close() aceita o fragmento', async () => {
    const ref: EvoModalRef = modals.open({ message: 'x', fragment: 'f1' });
    await estabilizar();
    expect(modals.close('f1')).toBe(true);
    expect(ref.isOpen()).toBe(false);
  });
});
