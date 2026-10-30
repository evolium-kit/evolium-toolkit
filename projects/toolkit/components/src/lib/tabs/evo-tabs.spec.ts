import {
  DOWN_ARROW,
  END,
  ENTER,
  HOME,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoTab } from './evo-tab';
import { EvoTabList } from './evo-tab-list';
import { EvoTabPanel } from './evo-tab-panel';
import { EvoTabs } from './evo-tabs';
import type { EvoTabEntry } from './tabs.types';

const IMPORTS = [EvoTabs, EvoTabList, EvoTab, EvoTabPanel];

/**
 * `keyCode` é o que o `FocusKeyManager` do CDK lê para setas, Home e End — o
 * jsdom não o preenche sozinho a partir de `key`.
 */
function tecla(el: Element, keyCode: number, key: string): void {
  const evento = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  Object.defineProperty(evento, 'keyCode', { get: () => keyCode });
  el.dispatchEvent(evento);
}

@Component({
  imports: IMPORTS,
  template: `
    <evo-tabs
      [(value)]="value"
      [orientation]="orientation()"
      [selectionFollowsFocus]="followsFocus()"
      ariaLabel="Secções"
    >
      <evo-tab-list [disableUnderline]="disableUnderline()">
        <button evoTab value="a">Tab A</button>
        <button evoTab value="b">Tab B</button>
        <button evoTab value="c" disabled>Tab C</button>
      </evo-tab-list>
      <evo-tab-panel value="a">Conteúdo A</evo-tab-panel>
      <evo-tab-panel value="b" [keepMounted]="keepMounted()">Conteúdo B</evo-tab-panel>
      <evo-tab-panel value="c">Conteúdo C</evo-tab-panel>
    </evo-tabs>
  `,
})
class Anfitriao {
  readonly value = signal<string | undefined>('a');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly followsFocus = signal(false);
  readonly disableUnderline = signal(false);
  readonly keepMounted = signal(false);
}

@Component({
  imports: IMPORTS,
  template: `
    <evo-tabs [(value)]="value">
      <evo-tab-list [tabs]="entradas()" />
    </evo-tabs>
  `,
})
class AnfitriaoDados {
  readonly value = signal<string | number | undefined>(1);
  readonly entradas = signal<readonly EvoTabEntry[]>([
    { value: 1, label: 'Um' },
    { value: 2, label: 'Dois', disabled: true },
  ]);
}

describe('EvoTabs', () => {
  let fixture: ComponentFixture<Anfitriao>;

  const tab = (texto: string): HTMLButtonElement =>
    [...fixture.nativeElement.querySelectorAll('button[evotab]')].find(
      (b: HTMLElement) => b.textContent?.trim() === texto,
    )!;
  const tablist = (): HTMLElement => fixture.nativeElement.querySelector('evo-tab-list');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    fixture.detectChanges();
  });

  it('marca a tab inicial como seleccionada e foca-a com roving tabindex', () => {
    expect(tab('Tab A').getAttribute('aria-selected')).toBe('true');
    expect(tab('Tab A').getAttribute('tabindex')).toBe('0');
    expect(tab('Tab B').getAttribute('tabindex')).toBe('-1');
    expect(tab('Tab A').getAttribute('aria-controls')).toBe(
      fixture.nativeElement.querySelectorAll('evo-tab-panel')[0].id,
    );
  });

  it('mostra só o painel da tab seleccionada', () => {
    const painéis = [...fixture.nativeElement.querySelectorAll('evo-tab-panel')] as HTMLElement[];
    expect(painéis[0].hasAttribute('hidden')).toBe(false);
    expect(painéis[1].hasAttribute('hidden')).toBe(true);
    expect(painéis[0].textContent).toContain('Conteúdo A');
    expect(painéis[1].textContent ?? '').not.toContain('Conteúdo B');
  });

  it('o painel activo tem sempre tabindex=0, como recomenda a APG (a Joy não põe)', () => {
    const painéis = [...fixture.nativeElement.querySelectorAll('evo-tab-panel')] as HTMLElement[];
    for (const p of painéis) expect(p.getAttribute('tabindex')).toBe('0');
  });

  it('o clique selecciona a tab na hora', () => {
    tab('Tab B').click();
    fixture.detectChanges();
    expect(tab('Tab B').getAttribute('aria-selected')).toBe('true');
    expect(tab('Tab A').getAttribute('aria-selected')).toBe('false');
    const painéis = [...fixture.nativeElement.querySelectorAll('evo-tab-panel')] as HTMLElement[];
    expect(painéis[0].hasAttribute('hidden')).toBe(true);
    expect(painéis[1].hasAttribute('hidden')).toBe(false);
  });

  it('a seta só move o foco (activação manual, omissão): a selecção não muda', () => {
    tab('Tab A').focus();
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight');
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab B'));
    expect(tab('Tab B').getAttribute('tabindex')).toBe('0');
    expect(tab('Tab A').getAttribute('tabindex')).toBe('-1');
    expect(tab('Tab A').getAttribute('aria-selected')).toBe('true');
    expect(tab('Tab B').getAttribute('aria-selected')).toBe('false');
  });

  it('Enter na tab focada selecciona-a', () => {
    tab('Tab A').focus();
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight');
    tecla(tablist(), ENTER, 'Enter');
    fixture.detectChanges();
    expect(tab('Tab B').getAttribute('aria-selected')).toBe('true');
  });

  it('Espaço na tab focada selecciona-a', () => {
    tab('Tab A').focus();
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight');
    tecla(tablist(), SPACE, ' ');
    fixture.detectChanges();
    expect(tab('Tab B').getAttribute('aria-selected')).toBe('true');
  });

  it('a seta salta a tab desactivada e dá wrap (correcção vs. a Joy, que a deixa focável)', () => {
    tab('Tab A').focus();
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight'); // a -> b
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight'); // b -> (salta c, desactivada) -> wrap -> a
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab A'));
  });

  it('Home/End vão para a primeira/última tab não desactivada', () => {
    tab('Tab A').focus();
    tecla(tablist(), END, 'End');
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab B'));
    tecla(tablist(), HOME, 'Home');
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab A'));
  });

  it('orientação vertical: ↑/↓ movem o foco, ←/→ não fazem nada (medido assim na Joy)', () => {
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    tab('Tab A').focus();
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight');
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab A'));
    tecla(tablist(), DOWN_ARROW, 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab B'));
    tecla(tablist(), UP_ARROW, 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(tab('Tab A'));
  });

  it('selectionFollowsFocus: a seta já selecciona, sem precisar de Enter', () => {
    fixture.componentInstance.followsFocus.set(true);
    fixture.detectChanges();
    tab('Tab A').focus();
    tecla(tablist(), RIGHT_ARROW, 'ArrowRight');
    fixture.detectChanges();
    expect(tab('Tab B').getAttribute('aria-selected')).toBe('true');
  });

  it('disableUnderline reflecte-se no atributo do host', () => {
    expect(tablist().hasAttribute('data-evo-disable-underline')).toBe(false);
    fixture.componentInstance.disableUnderline.set(true);
    fixture.detectChanges();
    expect(tablist().hasAttribute('data-evo-disable-underline')).toBe(true);
  });

  it('keepMounted mantém o conteúdo no DOM (escondido) em vez de o destruir', () => {
    tab('Tab A').click();
    fixture.detectChanges();
    const painéis = [...fixture.nativeElement.querySelectorAll('evo-tab-panel')] as HTMLElement[];
    expect(painéis[1].textContent ?? '').not.toContain('Conteúdo B');

    fixture.componentInstance.keepMounted.set(true);
    tab('Tab B').click();
    fixture.detectChanges();
    tab('Tab A').click();
    fixture.detectChanges();
    expect(painéis[1].hasAttribute('hidden')).toBe(true);
    expect(painéis[1].textContent).toContain('Conteúdo B');
  });

  it('ariaLabel/ariaLabelledby do <evo-tabs> aplicam-se ao role=tablist (não a um ancestral sem role, como medido na Joy)', () => {
    expect(tablist().getAttribute('role')).toBe('tablist');
    expect(tablist().getAttribute('aria-label')).toBe('Secções');
  });

  it('aria-controls/aria-labelledby cruzam tab e painel nos dois sentidos', () => {
    const t = tab('Tab A');
    const p = [...fixture.nativeElement.querySelectorAll('evo-tab-panel')][0] as HTMLElement;
    expect(t.getAttribute('aria-controls')).toBe(p.id);
    expect(p.getAttribute('aria-labelledby')).toBe(t.id);
  });

  /**
   * Regra 1. Sobre o TEXTO do CSS, não por `getComputedStyle`: o jsdom não
   * resolve `var()` nem interpreta `@layer`.
   */
  it('não declara os próprios tokens fora das variantes', () => {
    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((c) => c.includes('evo-tabs'))
      .join('\n');

    const base = css.slice(0, css.indexOf('@layer evo.variants'));
    const declaracoes = [...base.matchAll(/(^|[;{\s])(--evo-tabs-[a-z-]+)\s*:/g)];

    expect(declaracoes.map((m) => m[2])).toEqual([]);
    expect(css).toContain('var(--evo-tabs-indicator-color,');
  });
});

describe('EvoTabList por dados ([tabs])', () => {
  let fixture: ComponentFixture<AnfitriaoDados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AnfitriaoDados] }).compileComponents();
    fixture = TestBed.createComponent(AnfitriaoDados);
    fixture.detectChanges();
  });

  it('gera um botão evoTab por entrada, com disabled reflectido', () => {
    const botoes = [
      ...fixture.nativeElement.querySelectorAll('button[evotab]'),
    ] as HTMLButtonElement[];
    expect(botoes.map((b) => b.textContent?.trim())).toEqual(['Um', 'Dois']);
    expect(botoes[0].disabled).toBe(false);
    expect(botoes[1].disabled).toBe(true);
    expect(botoes[0].getAttribute('aria-selected')).toBe('true');
  });
});
