import { describe, expect, it } from 'vitest';
import {
  PIPELINE,
  compararVersoes,
  hoje,
  normalizarVersao,
  notasNaoPublicadas,
  prepararChangelog,
  trocarVersaoPackageJson,
} from './publicar-lib.mjs';

describe('PIPELINE', () => {
  /**
   * Regressão: num terminal interactivo, `ng test` entra em modo watch e a
   * publicação ficava parada em "Waiting for file changes…" para sempre.
   */
  it('o test:lib corre sem watch', () => {
    const testLib = PIPELINE.find(([, args]) => args.includes('test:lib'));
    expect(testLib?.[1]).toEqual(['run', 'test:lib', '--', '--watch=false']);
  });

  it('segue a ordem do release.yml: build antes de verificar e testar, instalação limpa no fim', () => {
    const passos = PIPELINE.map(([cmd, args]) => [cmd, ...args].join(' '));
    expect(passos.findIndex((p) => p.includes('build:lib'))).toBeLessThan(
      passos.findIndex((p) => p.includes('verify-dist')),
    );
    expect(passos.at(-1)).toBe('node tools/verify-install.mjs');
  });
});

describe('normalizarVersao', () => {
  it('aceita vX.Y.Z e X.Y.Z, e tira zeros à esquerda', () => {
    expect(normalizarVersao('v0.2.2')).toBe('0.2.2');
    expect(normalizarVersao('1.10.0')).toBe('1.10.0');
    expect(normalizarVersao(' v01.2.3 ')).toBe('1.2.3');
  });

  it('recusa o resto, incluindo pré-versões', () => {
    for (const mau of [undefined, '', 'v0.2', '0.2.2-beta.1', 'latest', 'vv0.2.2']) {
      expect(() => normalizarVersao(mau)).toThrow(/versão inválida/);
    }
  });
});

describe('compararVersoes', () => {
  it('compara numericamente, não como texto', () => {
    expect(compararVersoes('0.2.10', '0.2.9')).toBeGreaterThan(0);
    expect(compararVersoes('0.3.0', '0.10.0')).toBeLessThan(0);
    expect(compararVersoes('1.0.0', '1.0.0')).toBe(0);
  });
});

describe('prepararChangelog', () => {
  const base = [
    '# Changelog',
    '',
    '## [Não publicado]',
    '',
    '### Adicionado',
    '',
    '- Coisa nova.',
    '',
    '## [0.2.1] - 2026-10-15',
    '',
    '- Antiga.',
    '',
  ].join('\n');

  it('move o conteúdo para a secção nova e deixa [Não publicado] vazia', () => {
    expect(prepararChangelog(base, '0.2.2', '2026-10-20')).toBe(
      [
        '# Changelog',
        '',
        '## [Não publicado]',
        '',
        '## [0.2.2] - 2026-10-20',
        '',
        '### Adicionado',
        '',
        '- Coisa nova.',
        '',
        '## [0.2.1] - 2026-10-15',
        '',
        '- Antiga.',
        '',
      ].join('\n'),
    );
  });

  it('mantém CRLF', () => {
    const r = prepararChangelog(base.replace(/\n/g, '\r\n'), '0.2.2', '2026-10-20');
    expect(r).toContain('## [0.2.2] - 2026-10-20\r\n\r\n### Adicionado');
    expect(r.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('funciona quando [Não publicado] é a última secção', () => {
    const r = prepararChangelog('# C\n\n## [Não publicado]\n\n- Só esta.\n', '0.1.0', '2026-01-01');
    expect(r).toBe('# C\n\n## [Não publicado]\n\n## [0.1.0] - 2026-01-01\n\n- Só esta.\n');
  });

  it('falha com a secção vazia (só linhas em branco)', () => {
    const vazio = '# C\n\n## [Não publicado]\n\n\n## [0.2.1] - 2026-10-15\n';
    expect(() => prepararChangelog(vazio, '0.2.2', '2026-10-20')).toThrow(/está vazia/);
  });

  it('falha sem a secção, ou se a versão já existir', () => {
    expect(() => prepararChangelog('# C\n', '0.2.2', 'x')).toThrow(/não tem a secção/);
    expect(() => prepararChangelog(base, '0.2.1', 'x')).toThrow(/já tem uma secção/);
  });
});

describe('notasNaoPublicadas', () => {
  it('devolve o corpo da secção, sem linhas em branco nas pontas', () => {
    const texto =
      '# C\r\n\r\n## [Não publicado]\r\n\r\n### Corrigido\r\n\r\n- Bug.\r\n\r\n## [0.1.0] - x\r\n';
    expect(notasNaoPublicadas(texto)).toBe('### Corrigido\n\n- Bug.');
  });

  it('falha com a secção vazia', () => {
    expect(() => notasNaoPublicadas('## [Não publicado]\n\n## [0.1.0] - x\n')).toThrow(/vazia/);
  });
});

describe('trocarVersaoPackageJson', () => {
  it('troca só a versão, mantendo a formatação', () => {
    const texto = '{\n  "name": "x",\n  "version": "0.2.1",\n  "peer": { "version": "não" }\n}\n';
    expect(trocarVersaoPackageJson(texto, '0.2.2')).toBe(
      '{\n  "name": "x",\n  "version": "0.2.2",\n  "peer": { "version": "não" }\n}\n',
    );
  });
});

describe('hoje', () => {
  it('formata AAAA-MM-DD com a data local', () => {
    expect(hoje(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
