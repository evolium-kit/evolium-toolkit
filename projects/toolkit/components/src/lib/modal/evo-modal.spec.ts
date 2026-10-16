import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EvoModal } from './evo-modal';
import { EvoModalBeforeCloseFn, EvoModalCloseReason } from './modal.types';
import { provideEvoModalMessages } from './modal.messages';
import { evoModalMeta } from './modal.tokens';

@Component({
  imports: [EvoModal, EvoTokensDirective],
  template: `
    <section [evoTokens]="{ 'modal-radius': '2px' }">
      <evo-modal
        [(open)]="aberto"
        [heading]="titulo()"
        [ariaLabel]="rotulo()"
        [tone]="tom()"
        [size]="tamanho()"
        [position]="posicao()"
        [showClose]="comFechar()"
        [closeOnBackdrop]="fundoFecha()"
        [beforeClose]="guarda()"
        [evoTokens]="{ 'modal-bg': '#fafafa' }"
        (closed)="fechos.push($event)"
      >
        @if (comIcone()) {
          <svg slot="icon" class="icone-proprio" viewBox="0 0 24 24"></svg>
        }
        <p class="corpo">Corpo do modal</p>
        <input class="campo" />
        <div slot="footer"><button class="ok" (click)="aberto.set(false)">OK</button></div>
      </evo-modal>
    </section>
    <button class="abridor" (click)="aberto.set(true)">Abrir</button>
  `,
})
class Anfitriao {
  readonly aberto = signal(false);
  readonly titulo = signal('Editar empresa');
  readonly rotulo = signal('');
  readonly tom = signal<string | null>(null);
  readonly tamanho = signal('md');
  readonly posicao = signal<'center' | 'top'>('center');
  readonly comFechar = signal(true);
  readonly fundoFecha = signal(true);
  readonly guarda = signal<EvoModalBeforeCloseFn | null>(null);
  readonly comIcone = signal(false);
  readonly fechos: EvoModalCloseReason[] = [];
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

describe('EvoModal', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let host: Anfitriao;

  const painel = () =>
    document.querySelector<HTMLElement>('.cdk-overlay-container evo-modal-panel');
  const dialogo = () =>
    document.querySelector<HTMLElement>('.cdk-overlay-container [role="dialog"]');
  const pane = () => document.querySelector<HTMLElement>('.evo-modal-pane');
  const fundo = () => document.querySelector<HTMLElement>('.evo-modal-backdrop');

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
    const el = fixture.nativeElement.querySelector('evo-modal') as HTMLElement;
    expect(el.classList.contains('evo-modal')).toBe(true);
    expect(el.hasAttribute('data-evo-open')).toBe(false);
  });

  it('abre no overlay do CDK com o conteúdo projectado nos slots', async () => {
    await abrir();
    expect(painel()).not.toBeNull();
    expect(painel()!.querySelector('.evo-modal-panel__body .corpo')).not.toBeNull();
    expect(painel()!.querySelector('.evo-modal-panel__footer .ok')).not.toBeNull();
    expect(painel()!.querySelector('.evo-modal-panel__title')!.textContent).toContain(
      'Editar empresa',
    );
    expect(fixture.nativeElement.querySelector('evo-modal').hasAttribute('data-evo-open')).toBe(
      true,
    );
  });

  describe('ARIA', () => {
    it('é um diálogo modal com nome dado pelo título', async () => {
      await abrir();
      const d = dialogo()!;
      expect(d.getAttribute('aria-modal')).toBe('true');
      const titulo = painel()!.querySelector('.evo-modal-panel__title')!;
      expect(titulo.id).toMatch(/^evo-modal-\d+-title$/);
      expect(d.getAttribute('aria-labelledby')).toBe(titulo.id);
      expect(d.hasAttribute('aria-label')).toBe(false);
    });

    it('usa ariaLabel, e não o título, quando dado', async () => {
      host.rotulo.set('Detalhes');
      await abrir();
      expect(dialogo()!.getAttribute('aria-label')).toBe('Detalhes');
      expect(dialogo()!.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('o × tem nome acessível e o ícone está escondido dos leitores de ecrã', async () => {
      host.tom.set('success');
      await abrir();
      expect(painel()!.querySelector('.evo-modal-panel__close')!.getAttribute('aria-label')).toBe(
        'Fechar',
      );
      expect(painel()!.querySelector('.evo-modal-panel__icon')!.getAttribute('aria-hidden')).toBe(
        'true',
      );
    });

    it('ids únicos entre instâncias', async () => {
      const outra = TestBed.createComponent(Anfitriao);
      outra.componentInstance.aberto.set(true);
      outra.detectChanges();
      await abrir();
      await outra.whenStable();
      const ids = [...document.querySelectorAll('.evo-modal-panel__title')].map((t) => t.id);
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(2);
      outra.destroy();
    });
  });

  describe('fechar', () => {
    it('pelo Escape, devolvendo open a false', async () => {
      await abrir();
      await tecla('Escape');
      expect(painel()).toBeNull();
      expect(host.aberto()).toBe(false);
      expect(host.fechos).toEqual(['escape']);
      expect(fixture.nativeElement.querySelector('evo-modal').hasAttribute('data-evo-open')).toBe(
        false,
      );
    });

    it('pelo ×', async () => {
      await abrir();
      painel()!.querySelector<HTMLButtonElement>('.evo-modal-panel__close')!.click();
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

    it('por [(open)] a false, como programmatic', async () => {
      await abrir();
      host.aberto.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(painel()).toBeNull();
      expect(host.fechos).toEqual(['programmatic']);
    });

    it('beforeClose a false mantém-no aberto; a true deixa fechar', async () => {
      const motivos: EvoModalCloseReason[] = [];
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

    it('beforeClose não trava o fecho por [(open)]', async () => {
      host.guarda.set(() => false);
      await abrir();
      host.aberto.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(painel()).toBeNull();
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
    expect(painel()!.querySelector('.evo-modal-panel__close')).toBeNull();
  });

  it('reflecte tamanho, tom e posição', async () => {
    host.tamanho.set('lg');
    host.tom.set('warning');
    host.posicao.set('top');
    await abrir();
    expect(painel()!.getAttribute('data-evo-size')).toBe('lg');
    expect(painel()!.getAttribute('data-evo-tone')).toBe('warning');
    expect(painel()!.querySelector('.evo-modal-panel__tone-icon')).not.toBeNull();
    expect(pane()!.getAttribute('data-evo-size')).toBe('lg');
    expect(pane()!.getAttribute('data-evo-position')).toBe('top');
  });

  it('sem tom não há ícone nem atributo de tom', async () => {
    await abrir();
    expect(painel()!.hasAttribute('data-evo-tone')).toBe(false);
    expect(painel()!.querySelector('.evo-modal-panel__tone-icon')).toBeNull();
  });

  it('projecta um ícone próprio em slot="icon", antes do ícone do tom', async () => {
    host.tom.set('success');
    host.comIcone.set(true);
    await abrir();
    const icone = painel()!.querySelector('.evo-modal-panel__icon')!;
    expect(icone.firstElementChild!.classList.contains('icone-proprio')).toBe(true);
  });

  it('copia os [evoTokens] do host e dos ancestrais para o overlay, o mais próximo a ganhar', async () => {
    await abrir();
    const alvo = document.querySelector<HTMLElement>('.cdk-global-overlay-wrapper')!;
    expect(alvo.style.getPropertyValue('--evo-modal-bg')).toBe('#fafafa');
    expect(alvo.style.getPropertyValue('--evo-modal-radius')).toBe('2px');
    expect(fundo()!.style.getPropertyValue('--evo-modal-bg')).toBe('#fafafa');
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
      providers: [checkerSemLayout, provideEvoModalMessages({ close: 'Close' })],
    }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await abrir();
    expect(painel()!.querySelector('.evo-modal-panel__close')!.getAttribute('aria-label')).toBe(
      'Close',
    );
  });

  /**
   * Regra 1. O teste é feito sobre o TEXTO do CSS e não por getComputedStyle,
   * porque o jsdom não resolve var() nem interpreta @layer: uma verificação por
   * estilo computado passaria sempre, sem medir nada.
   */
  it('não declara os próprios tokens, e lê todos os do .tokens.ts', async () => {
    await abrir();

    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((c) => c.includes('evo-modal'))
      .join('\n');

    const declaracoes = [...css.matchAll(/(^|[;{\s])(--evo-modal-[a-z-]+)\s*:/g)];
    expect(declaracoes.map((m) => m[2])).toEqual([]);
    expect(css).toContain('var(--evo-modal-bg,');

    // Os tokens do fundo e do ícone projectado vivem na folha global, que o
    // TestBed não carrega; os do painel e do contentor têm de estar aqui.
    const globais = ['modal-backdrop', 'modal-backdrop-blur'];
    const contentor = ['modal-message-color'];
    for (const token of evoModalMeta.tokens) {
      if (globais.includes(token.name) || contentor.includes(token.name)) continue;
      expect(css, token.name).toContain(`var(--evo-${token.name},`);
    }
  });
});
