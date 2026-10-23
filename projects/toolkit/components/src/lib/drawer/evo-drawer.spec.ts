import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EvoDrawer } from './evo-drawer';
import { EvoDrawerBeforeCloseFn, EvoDrawerCloseReason, EvoDrawerPosition } from './drawer.types';
import { provideEvoDrawerMessages } from './drawer.messages';
import { evoDrawerMeta } from './drawer.tokens';

@Component({
  imports: [EvoDrawer, EvoTokensDirective],
  template: `
    <section [evoTokens]="{ 'drawer-width-md': '20rem' }">
      <evo-drawer
        [(open)]="aberto"
        [heading]="titulo()"
        [description]="descricao()"
        [ariaLabel]="rotulo()"
        [position]="posicao()"
        [size]="tamanho()"
        [backdrop]="comFundo()"
        [showClose]="comFechar()"
        [closeOnBackdrop]="fundoFecha()"
        [closeOnEscape]="escFecha()"
        [beforeClose]="guarda()"
        [evoTokens]="{ 'drawer-bg': '#fafafa' }"
        (closed)="fechos.push($event)"
      >
        @if (comCabecalho()) {
          <div slot="header" class="cabecalho-proprio">Cabeçalho próprio</div>
        }
        <p class="corpo">Corpo do drawer</p>
        <input class="campo" />
        <div slot="footer"><button class="ok" (click)="aberto.set(false)">OK</button></div>
      </evo-drawer>
    </section>
    <button class="abridor" (click)="aberto.set(true)">Abrir</button>
  `,
})
class Anfitriao {
  readonly aberto = signal(false);
  readonly titulo = signal('Comandos');
  readonly descricao = signal('');
  readonly rotulo = signal('');
  readonly posicao = signal<EvoDrawerPosition>('right');
  readonly tamanho = signal('md');
  readonly comFundo = signal(true);
  readonly comFechar = signal(true);
  readonly fundoFecha = signal(true);
  readonly escFecha = signal(true);
  readonly guarda = signal<EvoDrawerBeforeCloseFn | null>(null);
  readonly comCabecalho = signal(false);
  readonly fechos: EvoDrawerCloseReason[] = [];
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

describe('EvoDrawer', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let host: Anfitriao;

  const painel = () =>
    document.querySelector<HTMLElement>('.cdk-overlay-container evo-drawer-panel');
  const dialogo = () =>
    document.querySelector<HTMLElement>('.cdk-overlay-container [role="dialog"]');
  const pane = () => document.querySelector<HTMLElement>('.evo-drawer-pane');
  const fundo = () => document.querySelector<HTMLElement>('.evo-drawer-backdrop');

  async function abrir(): Promise<void> {
    host.aberto.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function tecla(key: string): Promise<void> {
    dialogo()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await esperar();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anfitriao],
      providers: [checkerSemLayout],
    }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  it('não desenha nada enquanto fechado', () => {
    expect(painel()).toBeNull();
    const el = fixture.nativeElement.querySelector('evo-drawer') as HTMLElement;
    expect(el.classList.contains('evo-drawer')).toBe(true);
    expect(el.hasAttribute('data-evo-open')).toBe(false);
  });

  it('abre no overlay do CDK com o conteúdo projectado nos slots', async () => {
    await abrir();
    expect(painel()).not.toBeNull();
    expect(painel()!.querySelector('.evo-drawer-panel__body .corpo')).not.toBeNull();
    expect(painel()!.querySelector('.evo-drawer-panel__footer .ok')).not.toBeNull();
    expect(painel()!.querySelector('.evo-drawer-panel__title')!.textContent).toContain('Comandos');
    expect(fixture.nativeElement.querySelector('evo-drawer').hasAttribute('data-evo-open')).toBe(
      true,
    );
  });

  describe('ARIA', () => {
    it('é um diálogo modal com nome dado pelo título', async () => {
      await abrir();
      const d = dialogo()!;
      expect(d.getAttribute('aria-modal')).toBe('true');
      const titulo = painel()!.querySelector('.evo-drawer-panel__title')!;
      expect(titulo.id).toMatch(/^evo-drawer-\d+-title$/);
      expect(d.getAttribute('aria-labelledby')).toBe(titulo.id);
      expect(d.hasAttribute('aria-label')).toBe(false);
    });

    it('usa ariaLabel, e não o título, quando dado', async () => {
      host.rotulo.set('Detalhes');
      await abrir();
      expect(dialogo()!.getAttribute('aria-label')).toBe('Detalhes');
      expect(dialogo()!.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('liga a descrição por aria-describedby quando há description', async () => {
      host.descricao.set('LD-45-67-AA');
      await abrir();
      const descricao = painel()!.querySelector('.evo-drawer-panel__description')!;
      expect(dialogo()!.getAttribute('aria-describedby')).toBe(descricao.id);
    });

    it('o × tem nome acessível', async () => {
      await abrir();
      expect(painel()!.querySelector('.evo-drawer-panel__close')!.getAttribute('aria-label')).toBe(
        'Fechar painel',
      );
    });

    it('ids únicos entre instâncias', async () => {
      const outra = TestBed.createComponent(Anfitriao);
      outra.componentInstance.aberto.set(true);
      outra.detectChanges();
      await abrir();
      await outra.whenStable();
      const ids = [...document.querySelectorAll('.evo-drawer-panel__title')].map((t) => t.id);
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
      outra.destroy();
    });
  });

  describe('cabeçalho próprio', () => {
    it('slot="header" substitui o título/descrição por omissão', async () => {
      host.comCabecalho.set(true);
      host.descricao.set('LD-45-67-AA');
      await abrir();
      expect(painel()!.querySelector('.cabecalho-proprio')).not.toBeNull();
    });
  });

  describe('fechar', () => {
    it('pelo Escape, devolvendo open a false', async () => {
      await abrir();
      await tecla('Escape');
      expect(painel()).toBeNull();
      expect(host.aberto()).toBe(false);
      expect(host.fechos).toEqual(['escape']);
      expect(fixture.nativeElement.querySelector('evo-drawer').hasAttribute('data-evo-open')).toBe(
        false,
      );
    });

    it('não fecha com Escape quando closeOnEscape é false', async () => {
      host.escFecha.set(false);
      await abrir();
      await tecla('Escape');
      expect(painel()).not.toBeNull();
    });

    it('pelo ×', async () => {
      await abrir();
      painel()!.querySelector<HTMLButtonElement>('.evo-drawer-panel__close')!.click();
      await esperar();
      expect(painel()).toBeNull();
      expect(host.fechos).toEqual(['close-button']);
    });

    it('pelo fundo, a não ser que closeOnBackdrop seja false', async () => {
      host.fundoFecha.set(false);
      await abrir();
      fundo()!.click();
      await esperar();
      expect(painel()).not.toBeNull();

      host.fundoFecha.set(true);
      fixture.detectChanges();
      fundo()!.click();
      await esperar();
      expect(painel()).toBeNull();
      expect(host.fechos).toEqual(['backdrop']);
    });

    it('sem fundo (backdrop=false) não há elemento de backdrop', async () => {
      host.comFundo.set(false);
      await abrir();
      expect(fundo()).toBeNull();
      expect(painel()).not.toBeNull();
    });

    it('por [(open)] a false, como programmatic', async () => {
      await abrir();
      host.aberto.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(painel()).toBeNull();
      expect(host.fechos).toEqual(['programmatic']);
    });

    it('beforeClose a false mantém-no aberto; a true deixa fechar', async () => {
      const motivos: EvoDrawerCloseReason[] = [];
      let deixar = false;
      host.guarda.set(async (motivo) => {
        motivos.push(motivo);
        return deixar;
      });
      await abrir();

      await tecla('Escape');
      expect(painel()).not.toBeNull();
      expect(host.aberto()).toBe(true);

      deixar = true;
      await tecla('Escape');
      expect(painel()).toBeNull();
      expect(motivos).toEqual(['escape', 'escape']);
    });

    it('fecha ao destruir o componente', async () => {
      await abrir();
      fixture.destroy();
      expect(painel()).toBeNull();
    });
  });

  it('sem × quando showClose é false', async () => {
    host.comFechar.set(false);
    await abrir();
    expect(painel()!.querySelector('.evo-drawer-panel__close')).toBeNull();
  });

  it('reflecte tamanho e posição no painel e no pane do CDK', async () => {
    host.tamanho.set('lg');
    host.posicao.set('left');
    await abrir();
    expect(painel()!.getAttribute('data-evo-size')).toBe('lg');
    expect(painel()!.getAttribute('data-evo-position')).toBe('left');
    expect(pane()!.getAttribute('data-evo-size')).toBe('lg');
    expect(pane()!.getAttribute('data-evo-position')).toBe('left');
  });

  it('um tamanho fora dos nomeados aplica-se como medida CSS literal no eixo do deslize', async () => {
    host.tamanho.set('24rem');
    host.posicao.set('left');
    await abrir();
    expect(painel()!.style.inlineSize).toBe('24rem');
    expect(painel()!.style.blockSize).toBe('');

    host.posicao.set('top');
    fixture.detectChanges();
    expect(painel()!.style.blockSize).toBe('24rem');
  });

  it('copia os [evoTokens] do host e dos ancestrais para o overlay, o mais próximo a ganhar', async () => {
    await abrir();
    const alvo = document.querySelector<HTMLElement>('.cdk-global-overlay-wrapper')!;
    expect(alvo.style.getPropertyValue('--evo-drawer-bg')).toBe('#fafafa');
    expect(alvo.style.getPropertyValue('--evo-drawer-width-md')).toBe('20rem');
    expect(fundo()!.style.getPropertyValue('--evo-drawer-bg')).toBe('#fafafa');
  });

  it('o foco vai para o primeiro elemento focável e volta a quem abriu', async () => {
    const abridor = fixture.nativeElement.querySelector('.abridor') as HTMLButtonElement;
    abridor.focus();
    await abrir();
    await esperar();
    expect(document.activeElement?.classList.contains('campo')).toBe(true);

    await tecla('Escape');
    await esperar();
    expect(document.activeElement).toBe(abridor);
  });

  it('aceita mensagens próprias', async () => {
    fixture.destroy();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Anfitriao],
      providers: [checkerSemLayout, provideEvoDrawerMessages({ close: 'Close' })],
    }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await abrir();
    expect(painel()!.querySelector('.evo-drawer-panel__close')!.getAttribute('aria-label')).toBe(
      'Close',
    );
  });

  /**
   * Regra 1. O teste é feito sobre o TEXTO do CSS e não por getComputedStyle,
   * porque o jsdom não resolve var() nem interpreta @layer: uma verificação
   * por estilo computado passaria sempre, sem medir nada.
   */
  it('não declara os próprios tokens, e lê todos os do .tokens.ts', async () => {
    await abrir();

    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((c) => c.includes('evo-drawer'))
      .join('\n');

    const declaracoes = [...css.matchAll(/(^|[;{\s])(--evo-drawer-[a-z-]+)\s*:/g)];
    expect(declaracoes.map((m) => m[2])).toEqual([]);
    expect(css).toContain('var(--evo-drawer-bg,');

    // Os tokens do fundo e do cabeçalho-próprio vivem na folha global, que o
    // TestBed não carrega; os do painel e do contentor têm de estar aqui.
    const globais = ['drawer-backdrop', 'drawer-backdrop-blur'];
    const contentor: string[] = [];
    for (const token of evoDrawerMeta.tokens) {
      if (globais.includes(token.name) || contentor.includes(token.name)) continue;
      expect(css, token.name).toContain(`var(--evo-${token.name},`);
    }
  });
});
