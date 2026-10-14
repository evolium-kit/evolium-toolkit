import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoTokensDirective } from './evo-tokens.directive';
import { EvoTokenMap, EvoTokenName } from './token-names';

@Component({
  imports: [EvoTokensDirective],
  template: `<div [evoTokens]="tokens()"></div>`,
})
class Anfitriao {
  readonly tokens = signal<EvoTokenMap>({ 'text-field-ring-width': '4px' });
}

describe('EvoTokensDirective', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let div: HTMLDivElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    fixture.detectChanges();
    div = fixture.nativeElement.querySelector('div');
  });

  it('acrescenta o prefixo --evo- à forma curta', () => {
    expect(div.style.getPropertyValue('--evo-text-field-ring-width')).toBe('4px');
  });

  it('aceita a forma completa sem a alterar', () => {
    fixture.componentInstance.tokens.set({ '--app-accent': 'red' });
    fixture.detectChanges();
    expect(div.style.getPropertyValue('--app-accent')).toBe('red');
  });

  it('remove os tokens que saem do mapa, e os null', () => {
    fixture.componentInstance.tokens.set({ 'button-bg': '#000', 'button-fg': null });
    fixture.detectChanges();
    expect(div.style.getPropertyValue('--evo-text-field-ring-width')).toBe('');
    expect(div.style.getPropertyValue('--evo-button-bg')).toBe('#000');
    expect(div.style.getPropertyValue('--evo-button-fg')).toBe('');
  });
});

/*
 * Verificações de tipo: o que interessa aqui é que o build da biblioteca
 * compile (ou recuse) estas linhas, não o que fazem em runtime.
 */
describe('EvoTokenMap (tipos)', () => {
  it('aceita tokens conhecidos, globais e de componente', () => {
    const ok: EvoTokenMap = {
      'color-primary': '#000',
      'text-field-ring-width': '2px',
      'field-hint-fg': 'gray',
      '--evo-qualquer': '1px',
    };
    const nome: EvoTokenName = 'switch-bg-checked';
    expect(Object.keys(ok)).toHaveLength(4);
    expect(nome).toBe('switch-bg-checked');
  });

  it('recusa um nome curto que nenhum CSS lê', () => {
    // @ts-expect-error — 'ring-width' não existe; o certo é 'text-field-ring-width'.
    const errado: EvoTokenMap = { 'ring-width': '20px' };
    expect(errado).toBeDefined();
  });
});
