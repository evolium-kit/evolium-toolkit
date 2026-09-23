import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EvoButton } from './evo-button';

@Component({
  imports: [EvoButton],
  template: `
    <button
      evoButton
      [variant]="variant()"
      [size]="size()"
      [loading]="loading()"
      [disabled]="disabled()"
    >
      Guardar
    </button>
  `,
})
class Anfitriao {
  readonly variant = signal('solid');
  readonly size = signal('md');
  readonly loading = signal(false);
  readonly disabled = signal(false);
}

describe('EvoButton', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let botao: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    fixture.detectChanges();
    botao = fixture.nativeElement.querySelector('button');
  });

  it('aplica a classe base', () => {
    expect(botao.classList.contains('evo-button')).toBe(true);
  });

  it('reflecte variante e tamanho como atributos de dados', () => {
    expect(botao.getAttribute('data-evo-variant')).toBe('solid');
    expect(botao.getAttribute('data-evo-size')).toBe('md');

    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();

    expect(botao.getAttribute('data-evo-variant')).toBe('danger');
    expect(botao.getAttribute('data-evo-size')).toBe('lg');
  });

  it('aceita variantes que a toolkit não conhece', () => {
    // O (string & {}) na union existe para o projecto poder definir as suas.
    fixture.componentInstance.variant.set('promocional');
    fixture.detectChanges();
    expect(botao.getAttribute('data-evo-variant')).toBe('promocional');
  });

  it('permite compor variantes com espaço, para o selector ~=', () => {
    fixture.componentInstance.variant.set('ghost compacto');
    fixture.detectChanges();
    expect(botao.getAttribute('data-evo-variant')).toBe('ghost compacto');
  });

  describe('estado de carregamento', () => {
    beforeEach(() => {
      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();
    });

    it('anuncia-se como ocupado', () => {
      expect(botao.getAttribute('aria-busy')).toBe('true');
      expect(botao.getAttribute('aria-disabled')).toBe('true');
    });

    it('mostra o indicador, escondido dos leitores de ecrã', () => {
      const spinner = botao.querySelector('.evo-button__spinner');
      expect(spinner).not.toBeNull();
      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    });

    it('não deixa atributos para trás ao sair do estado', () => {
      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();
      expect(botao.hasAttribute('aria-busy')).toBe(false);
      expect(botao.hasAttribute('data-evo-loading')).toBe(false);
      expect(botao.querySelector('.evo-button__spinner')).toBeNull();
    });
  });

  it('projecta o conteúdo', () => {
    expect(botao.textContent?.trim()).toContain('Guardar');
  });

  /**
   * Regra 1 do CSS: o componente nunca declara os seus próprios tokens de
   * camada 3 — o valor por omissão vive no fallback do `var()`. Declarar
   * `--evo-button-bg` na regra do host ganharia por proximidade a qualquer
   * `:root` do projecto e tornaria o override global impossível.
   *
   * O teste é feito sobre o TEXTO do CSS, e não sobre `getComputedStyle`,
   * porque o jsdom não resolve `var()` nem interpreta `@layer`: uma verificação
   * por estilo computado passaria sempre, medindo nada. A cascata a sério é
   * validada no browser — ver o playground em src/app.
   */
  describe('regra 1: o CSS não declara os próprios tokens', () => {
    /** CSS que o Angular injectou para este componente. */
    function cssDoComponente(): string {
      return [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .filter((css) => css.includes('.evo-button') || css.includes('evo-button__spinner'))
        .join('\n');
    }

    it('usa o fallback do var() para cada token de aparência', () => {
      const css = cssDoComponente();
      expect(css).toContain('var(--evo-button-bg,');
      expect(css).toContain('var(--evo-button-fg,');
      expect(css).toContain('var(--evo-button-radius,');
    });

    it('não declara tokens de botão fora das variantes', () => {
      const css = cssDoComponente();
      const blocoBase = css.slice(0, css.indexOf('@layer evo.variants'));

      // Uma declaração é `--evo-button-x:`; um consumo é `var(--evo-button-x,`.
      const declaracoes = [...blocoBase.matchAll(/(^|[;{\s])(--evo-button-[a-z-]+)\s*:/g)].map(
        (m) => m[2],
      );

      expect(declaracoes).toEqual([]);
    });

    it('declara os tokens apenas dentro de evo.variants', () => {
      const css = cssDoComponente();
      const blocoVariantes = css.slice(css.indexOf('@layer evo.variants'));
      expect(blocoVariantes).toContain('--evo-button-bg:');
    });
  });
});
