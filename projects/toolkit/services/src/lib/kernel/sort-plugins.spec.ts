import { describe, expect, it } from 'vitest';
import { sortPlugins } from './sort-plugins';
import { EvoPlugin } from './types';

function plugin(name: string, dependsOn: readonly string[] = []): EvoPlugin {
  return { name, dependsOn, setup: () => ({}) };
}

const nomes = (plugins: readonly EvoPlugin[]): readonly string[] => plugins.map((p) => p.name);

describe('sortPlugins', () => {
  it('mantém a ordem quando não há dependências', () => {
    expect(nomes(sortPlugins([plugin('a'), plugin('b')]))).toEqual(['a', 'b']);
  });

  it('coloca a dependência antes de quem depende dela', () => {
    const ordenados = sortPlugins([plugin('oauth', ['auth']), plugin('auth')]);
    expect(nomes(ordenados)).toEqual(['auth', 'oauth']);
  });

  it('resolve cadeias de dependências', () => {
    const ordenados = sortPlugins([plugin('c', ['b']), plugin('b', ['a']), plugin('a')]);
    expect(nomes(ordenados)).toEqual(['a', 'b', 'c']);
  });

  it('não duplica uma dependência partilhada', () => {
    const ordenados = sortPlugins([plugin('b', ['a']), plugin('c', ['a']), plugin('a')]);
    expect(nomes(ordenados)).toEqual(['a', 'b', 'c']);
  });

  it('nomeia o plugin em falta, e quem o pedia', () => {
    expect(() => sortPlugins([plugin('facturas', ['auth'])])).toThrow(
      /"facturas" depende de "auth"/,
    );
  });

  it('mostra o caminho completo de um ciclo', () => {
    expect(() => sortPlugins([plugin('a', ['b']), plugin('b', ['a'])])).toThrow(
      /ciclo de dependências/,
    );
  });

  it('detecta um ciclo sobre o próprio plugin', () => {
    expect(() => sortPlugins([plugin('a', ['a'])])).toThrow(/ciclo de dependências/);
  });
});
