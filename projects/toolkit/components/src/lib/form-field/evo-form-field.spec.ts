import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoFormField } from './evo-form-field';

describe('EvoFormField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EvoFormField] }).compileComponents();
  });

  it('aplica a classe base', () => {
    const fixture = TestBed.createComponent(EvoFormField);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('evo-form-field')).toBe(true);
  });

  /**
   * Regra 1. O teste e feito sobre o TEXTO do CSS e nao por getComputedStyle,
   * porque o jsdom nao resolve var() nem interpreta @layer: uma verificacao por
   * estilo computado passaria sempre, sem medir nada.
   */
  it('nao declara os proprios tokens fora das variantes', () => {
    const fixture = TestBed.createComponent(EvoFormField);
    fixture.detectChanges();

    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((c) => c.includes('evo-form-field'))
      .join('\n');

    const base = css.slice(0, css.indexOf('@layer evo.variants'));
    const declaracoes = [...base.matchAll(/(^|[;{\s])(--evo-form-field-[a-z-]+)\s*:/g)];

    expect(declaracoes.map((m) => m[2])).toEqual([]);
    expect(css).toContain('var(--evo-form-field-bg,');
  });
});
