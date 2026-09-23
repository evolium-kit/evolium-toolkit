import { TestBed } from '@angular/core/testing';
import {
  EVO_THEME_PERSISTENCE,
  EvoThemeSnapshot,
  ThemePersistence,
} from '@evolium-kit/toolkit/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoThemeStore } from './evo-theme-store';
import { provideEvoTheme } from './provide-evo-theme';

/** Adapter controlado, para injectar snapshots arbitrários. */
class FakePersistence implements ThemePersistence {
  readonly id = 'fake';
  snapshot: EvoThemeSnapshot | null = null;

  async load(): Promise<EvoThemeSnapshot | null> {
    return this.snapshot;
  }
  async save(snapshot: EvoThemeSnapshot): Promise<void> {
    this.snapshot = snapshot;
  }
  async clear(): Promise<void> {
    this.snapshot = null;
  }
}

function snapshotParcial(overrides: Partial<EvoThemeSnapshot>): EvoThemeSnapshot {
  return {
    id: 'evolium-flat',
    name: 'Evolium Flat',
    version: 1,
    tokens: {},
    darkTokens: {},
    variants: {},
    scheme: 'light',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('EvoThemeStore', () => {
  let persistence: FakePersistence;
  let store: EvoThemeStore;

  beforeEach(() => {
    persistence = new FakePersistence();
    TestBed.configureTestingModule({
      providers: [provideEvoTheme(), { provide: EVO_THEME_PERSISTENCE, useValue: persistence }],
    });
    store = TestBed.inject(EvoThemeStore);
  });

  it('arranca com os tokens por omissão', () => {
    expect(store.tokens()['--evo-color-primary']).toBe('#2563eb');
    expect(store.darkTokens()['--evo-color-primary']).toBe('#60a5fa');
  });

  it('setToken marca o tema como por gravar', () => {
    expect(store.dirty()).toBe(false);
    store.setToken('color-primary', '#7c3aed');
    expect(store.dirty()).toBe(true);
    expect(store.tokens()['--evo-color-primary']).toBe('#7c3aed');
  });

  it('aceita a forma curta e a completa do nome do token', () => {
    store.setToken('color-primary', '#111111');
    store.setToken('--evo-color-danger', '#222222');
    expect(store.tokens()['--evo-color-primary']).toBe('#111111');
    expect(store.tokens()['--evo-color-danger']).toBe('#222222');
  });

  describe('restore', () => {
    it('aplica os tokens guardados', async () => {
      persistence.snapshot = snapshotParcial({ tokens: { '--evo-color-primary': '#dc2626' } });
      await store.restore();
      expect(store.tokens()['--evo-color-primary']).toBe('#dc2626');
      expect(store.dirty()).toBe(false);
    });

    // Regressão: um snapshot gravado por uma versão anterior da toolkit não pode
    // apagar tokens acrescentados entretanto. Antes da correcção, `restore`
    // substituía os mapas e um snapshot com darkTokens vazio deixava o modo
    // escuro sem nenhuma cor — o <style> ficava sem o bloco [data-evo-scheme].
    it('funde sobre os defaults em vez de os substituir', async () => {
      persistence.snapshot = snapshotParcial({
        tokens: { '--evo-color-primary': '#7c3aed' },
        darkTokens: {},
      });

      await store.restore();

      // o que o utilizador alterou é preservado
      expect(store.tokens()['--evo-color-primary']).toBe('#7c3aed');
      // o que ele nunca tocou continua lá
      expect(store.tokens()['--evo-color-surface']).toBe('#ffffff');
      // e a paleta escura não desaparece por o snapshot não a mencionar
      expect(store.darkTokens()['--evo-color-surface']).toBe('#0f172a');
      expect(store.darkTokens()['--evo-color-on-surface']).toBe('#e2e8f0');
    });

    it('ignora um snapshot de versão desconhecida', async () => {
      persistence.snapshot = {
        ...snapshotParcial({ tokens: { '--evo-color-primary': '#000000' } }),
        version: 99 as unknown as 1,
      };
      await store.restore();
      expect(store.tokens()['--evo-color-primary']).toBe('#2563eb');
    });
  });

  it('reset volta aos defaults e limpa o estado por gravar', () => {
    store.setToken('color-primary', '#000000');
    store.reset();
    expect(store.tokens()['--evo-color-primary']).toBe('#2563eb');
    expect(store.dirty()).toBe(false);
  });

  it('escreve o CSS do tema num único <style id="evo-theme">', () => {
    const elementos = document.querySelectorAll('style#evo-theme');
    expect(elementos.length).toBe(1);
    expect(elementos[0]?.textContent).toContain('--evo-color-primary');
  });
});
