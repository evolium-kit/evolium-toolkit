import { describe, expect, it } from 'vitest';
import { buildThemeCss } from './build-theme-css';

const empty = { tokens: {}, darkTokens: {}, variants: {} };

describe('buildThemeCss', () => {
  it('envolve tudo em @layer evo.overrides', () => {
    const css = buildThemeCss({ ...empty, tokens: { '--evo-color-primary': '#fff' } });
    expect(css.startsWith('@layer evo.overrides {')).toBe(true);
    expect(css.endsWith('}')).toBe(true);
  });

  it('escreve os tokens claros em :root', () => {
    const css = buildThemeCss({ ...empty, tokens: { '--evo-color-primary': '#2563eb' } });
    expect(css).toContain(':root{--evo-color-primary:#2563eb;}');
  });

  it('gera os dois selectores de modo escuro', () => {
    const css = buildThemeCss({ ...empty, darkTokens: { '--evo-color-primary': '#60a5fa' } });

    // escuro forçado pelo utilizador
    expect(css).toContain(':root[data-evo-scheme="dark"]{color-scheme:dark;');
    // esquema `system` com o SO em escuro, sem atropelar o claro forçado
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(':root:not([data-evo-scheme="light"])');
  });

  it('usa ~= no selector de variante, para permitir variantes compostas', () => {
    const css = buildThemeCss({
      ...empty,
      variants: { 'button.danger': { '--evo-button-bg': '#dc2626' } },
    });
    expect(css).toContain('.evo-button[data-evo-variant~="danger"]{--evo-button-bg:#dc2626;}');
  });

  it('não emite blocos vazios', () => {
    expect(buildThemeCss(empty)).toBe('@layer evo.overrides {}');
  });

  it('ignora variantes com chave malformada', () => {
    const css = buildThemeCss({
      ...empty,
      variants: { semponto: { '--evo-button-bg': 'red' }, '.vazio': { '--evo-x': 'y' } },
    });
    expect(css).not.toContain('semponto');
  });

  describe('segurança — o único obstáculo entre o Theme Studio e um XSS', () => {
    it('rejeita um valor que tente fechar o bloco <style>', () => {
      const css = buildThemeCss({
        ...empty,
        tokens: { '--evo-color-primary': 'red}</style><script>alert(1)</script>' },
      });
      expect(css).not.toContain('<script>');
      expect(css).not.toContain('</style>');
    });

    it.each(['@import "evil.css"', 'url(https://evil.example)', 'expression(alert(1))'])(
      'rejeita o valor %s',
      (value) => {
        const css = buildThemeCss({ ...empty, tokens: { '--evo-x': value } });
        expect(css).toBe('@layer evo.overrides {}');
      },
    );

    it('rejeita nomes que não sejam custom properties válidas', () => {
      const css = buildThemeCss({
        ...empty,
        tokens: { 'color: red; body': 'x', '--evo-ok': '#fff' },
      });
      expect(css).toContain('--evo-ok:#fff;');
      expect(css).not.toContain('body');
    });

    it('descarta o token inválido mas preserva os válidos', () => {
      const css = buildThemeCss({
        ...empty,
        tokens: { '--evo-mau': 'url(x)', '--evo-bom': '#0f172a' },
      });
      expect(css).toContain('--evo-bom:#0f172a;');
      expect(css).not.toContain('--evo-mau');
    });

    it('neutraliza aspas no nome da variante', () => {
      const css = buildThemeCss({
        ...empty,
        variants: { 'button.a"]{color:red}[x': { '--evo-button-bg': '#fff' } },
      });
      expect(css).not.toContain('"]{color:red}');
    });
  });
});
