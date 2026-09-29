import { TestBed } from '@angular/core/testing';
import {
  EVO_THEME_PERSISTENCE,
  EvoThemeSnapshot,
  ThemePersistence,
} from '@evolium-kit/toolkit/core';
import { EvoThemeStore, provideEvoTheme } from '@evolium-kit/toolkit/theme';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoStudioHeader } from './studio-header';

/** Adapter controlado; `falhar` faz o próximo `save` rejeitar. */
class FakePersistence implements ThemePersistence {
  readonly id = 'fake';
  guardados = 0;
  falhar = false;

  async load(): Promise<EvoThemeSnapshot | null> {
    return null;
  }
  async save(): Promise<void> {
    if (this.falhar) throw new Error('rede em baixo');
    this.guardados++;
  }
  async clear(): Promise<void> {}
}

function montar(persistence: ThemePersistence | null = new FakePersistence()) {
  TestBed.configureTestingModule({
    providers: [provideEvoTheme(), { provide: EVO_THEME_PERSISTENCE, useValue: persistence }],
  });
  const fixture = TestBed.createComponent(EvoStudioHeader);
  fixture.componentRef.setInput('esquerdaAberta', true);
  fixture.componentRef.setInput('direitaAberta', true);
  fixture.detectChanges();

  const el = fixture.nativeElement as HTMLElement;
  const botaoGuardar = () =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Guard'))!;

  return { fixture, el, store: TestBed.inject(EvoThemeStore), botaoGuardar };
}

async function estabilizar(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('EvoStudioHeader', () => {
  let persistence: FakePersistence;

  beforeEach(() => {
    persistence = new FakePersistence();
  });

  it('Guardar fica indisponível sem alterações por gravar', () => {
    const { botaoGuardar } = montar(persistence);
    expect(botaoGuardar().getAttribute('aria-disabled')).toBe('true');
    botaoGuardar().click();
    expect(persistence.guardados).toBe(0);
  });

  it('com alterações, guarda e confirma', async () => {
    const { fixture, el, store, botaoGuardar } = montar(persistence);
    store.setToken('color-primary', '#7c3aed');
    fixture.detectChanges();

    expect(botaoGuardar().getAttribute('aria-disabled')).toBe('false');
    expect(botaoGuardar().textContent).toContain('com alterações por gravar');

    botaoGuardar().click();
    await estabilizar(fixture);

    expect(persistence.guardados).toBe(1);
    expect(store.dirty()).toBe(false);
    expect(botaoGuardar().textContent).toContain('Guardado');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Tema guardado');
  });

  it('um erro ao guardar fica visível e mantém as alterações', async () => {
    persistence.falhar = true;
    const { fixture, el, store, botaoGuardar } = montar(persistence);
    store.setToken('color-primary', '#7c3aed');
    fixture.detectChanges();

    botaoGuardar().click();
    await estabilizar(fixture);

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível guardar');
    expect(store.dirty()).toBe(true);
  });

  it('sem persistência configurada, Guardar explica porque não guarda', () => {
    const { fixture, store, botaoGuardar } = montar(null);
    store.setToken('color-primary', '#7c3aed');
    fixture.detectChanges();

    expect(botaoGuardar().getAttribute('aria-disabled')).toBe('true');
    expect(botaoGuardar().title).toContain('Exportar');
  });

  it('Ctrl+S guarda e impede o diálogo do browser', async () => {
    const { fixture, store } = montar(persistence);
    store.setToken('color-primary', '#7c3aed');

    const evento = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true });
    document.dispatchEvent(evento);
    await estabilizar(fixture);

    expect(evento.defaultPrevented).toBe(true);
    expect(persistence.guardados).toBe(1);
  });

  it('Ctrl+K põe o foco na pesquisa', () => {
    const { el } = montar(persistence);
    document.body.appendChild(el);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

    expect(document.activeElement).toBe(el.querySelector('#st-pesquisa'));
    el.remove();
  });

  it('a pesquisa escrita chega ao model', () => {
    const { fixture, el } = montar(persistence);
    const campo = el.querySelector<HTMLInputElement>('#st-pesquisa')!;

    campo.value = 'bot';
    campo.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.pesquisa()).toBe('bot');
  });
});
