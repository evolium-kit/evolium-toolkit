import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoProgressBar } from './evo-progress-bar';

const esperar = () => new Promise((r) => setTimeout(r));
const esperarMs = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Component({ template: '' })
class Pagina {}

describe('EvoProgressBar — modo manual', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EvoProgressBar] }).compileComponents();
  });

  it('por omissão (value=null) fica oculta', () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.classList.contains('evo-progress-bar')).toBe(true);
    expect(host.getAttribute('data-evo-estado')).toBe('oculto');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('aria-valuenow')).toBeNull();
    expect(host.getAttribute('role')).toBe('progressbar');
  });

  it('reflecte o value e sai do estado quando volta a null', () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('data-evo-estado')).toBe('activo');
    expect(host.getAttribute('aria-hidden')).toBeNull();
    expect(host.getAttribute('aria-valuenow')).toBe('42');
    expect(host.getAttribute('aria-valuemin')).toBe('0');
    expect(host.getAttribute('aria-valuemax')).toBe('100');

    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();

    expect(host.getAttribute('data-evo-estado')).toBe('oculto');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.getAttribute('aria-valuenow')).toBeNull();
  });

  it('indeterminate ignora value, não tem aria-valuenow, e sai do estado ao desligar', () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('data-evo-estado')).toBe('activo');
    expect(host.getAttribute('data-evo-indeterminado')).toBe('');
    expect(host.getAttribute('aria-valuenow')).toBeNull();
    expect(host.getAttribute('aria-valuemin')).toBeNull();

    fixture.componentRef.setInput('indeterminate', false);
    fixture.detectChanges();

    expect(host.getAttribute('data-evo-estado')).toBe('oculto');
    expect(host.getAttribute('data-evo-indeterminado')).toBeNull();
  });

  it('aceita ariaLabel', () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('ariaLabel', 'A enviar ficheiro');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-label')).toBe(
      'A enviar ficheiro',
    );
  });

  /**
   * Regra 1. O teste é feito sobre o TEXTO do CSS e não por getComputedStyle,
   * porque o jsdom não resolve var() nem interpreta @layer: uma verificação por
   * estilo computado passaria sempre, sem medir nada. Este componente não tem
   * @layer evo.variants (sem tamanhos) — por isso verifica-se o ficheiro todo.
   */
  it('não declara os próprios tokens em lado nenhum do CSS', () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.detectChanges();

    const css = [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((c) => c.includes('evo-progress-bar'))
      .join('\n');

    const declaracoes = [...css.matchAll(/(^|[;{\s])(--evo-progress-bar-[a-z-]+)\s*:/g)];
    expect(declaracoes.map((m) => m[2])).toEqual([]);

    for (const token of [
      'progress-bar-height',
      'progress-bar-color',
      'progress-bar-duration',
      'progress-bar-z-index',
      'progress-bar-glow-color',
      'progress-bar-indeterminate-duration',
    ]) {
      expect(css).toContain(`var(--evo-${token},`);
    }
  });
});

describe('EvoProgressBar — modo router', () => {
  const atraso = { ms: 400 };
  const guardaLenta = () =>
    new Promise<boolean>((resolve) => setTimeout(() => resolve(true), atraso.ms));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvoProgressBar],
      providers: [
        provideLocationMocks(),
        provideRouter([
          { path: '', component: Pagina },
          { path: 'lenta', component: Pagina, canActivate: [guardaLenta] },
          { path: 'lenta2', component: Pagina, canActivate: [guardaLenta] },
          { path: 'rapida', component: Pagina },
        ]),
      ],
    }).compileComponents();
    atraso.ms = 400;
  });

  it('entra ao navegar, "treme" e desvanece ao concluir', async () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('mode', 'router');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);

    const navegacao = router.navigateByUrl('/lenta');
    await esperar();
    fixture.detectChanges();
    expect(host.getAttribute('data-evo-estado')).toBe('activo');
    expect(host.getAttribute('aria-valuenow')).toBe('8');

    await esperarMs(220);
    fixture.detectChanges();
    expect(Number(host.getAttribute('aria-valuenow'))).toBeGreaterThan(8);

    await navegacao;
    fixture.detectChanges();
    expect(host.getAttribute('data-evo-estado')).toBe('a-concluir');
    expect(host.getAttribute('aria-valuenow')).toBe('100');

    await esperarMs(260);
    fixture.detectChanges();
    expect(host.getAttribute('data-evo-estado')).toBe('oculto');
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('uma navegação sobreposta reinicia a barra, em vez de continuar o trickle anterior', async () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('mode', 'router');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);

    router.navigateByUrl('/lenta');
    await esperar();
    fixture.detectChanges();
    expect(host.getAttribute('aria-valuenow')).toBe('8');

    await esperarMs(220);
    fixture.detectChanges();
    expect(Number(host.getAttribute('aria-valuenow'))).toBeGreaterThan(8);

    atraso.ms = 10;
    const segunda = router.navigateByUrl('/lenta2');
    await esperar();
    fixture.detectChanges();
    expect(host.getAttribute('data-evo-estado')).toBe('activo');
    expect(host.getAttribute('aria-valuenow')).toBe('8');

    await segunda;
    fixture.detectChanges();
    expect(host.getAttribute('data-evo-estado')).toBe('a-concluir');
  });

  it('ignora eventos do Router quando mode volta a manual', async () => {
    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('mode', 'router');
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentRef.setInput('mode', 'manual');
    fixture.detectChanges();
    await router.navigateByUrl('/rapida');
    fixture.detectChanges();

    expect(host.getAttribute('data-evo-estado')).toBe('oculto');
  });
});

describe('EvoProgressBar — SSR', () => {
  it('não acede ao Router nem arranca temporizadores no servidor', async () => {
    await TestBed.configureTestingModule({
      imports: [EvoProgressBar],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(EvoProgressBar);
    fixture.componentRef.setInput('mode', 'router');
    expect(() => fixture.detectChanges()).not.toThrow();
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-evo-estado')).toBe('oculto');
  });
});
