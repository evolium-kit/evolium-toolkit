import { describe, expect, it } from 'vitest';
import {
  agruparTokens,
  assinatura,
  celula,
  declaracoesDaFonte,
  exportsDoDts,
  metaDosTokens,
  resumoJsDoc,
  simbolosDaFonte,
} from './agents-md-lib.mjs';

describe('exportsDoDts', () => {
  it('lê os blocos export {…} e export type {…} do fim do .d.ts', () => {
    const dts = [
      'declare class EvoX {}',
      'export { EvoX, evoY as evoZ, provideEvo };',
      'export type { EvoTipo, Outro };',
    ].join('\n');
    expect(exportsDoDts(dts)).toEqual({
      valores: ['EvoX', 'evoZ', 'provideEvo'],
      tipos: ['EvoTipo', 'Outro'],
    });
  });
});

describe('resumoJsDoc', () => {
  it('fica com a primeira frase, sem asteriscos, tags nem exemplos', () => {
    const bloco = `*
   * Campo de texto completo numa só tag.
   * Mais detalhe que não interessa.
   *
   * \`\`\`html
   * <x />
   * \`\`\`
   * @param y ignorado`;
    expect(resumoJsDoc(bloco)).toBe('Campo de texto completo numa só tag.');
  });

  it('sem bloco, devolve vazio; texto longo é cortado', () => {
    expect(resumoJsDoc(undefined)).toBe('');
    expect(resumoJsDoc(`* ${'a'.repeat(300)}`)).toHaveLength(158);
  });
});

describe('simbolosDaFonte', () => {
  it('encontra os exports com o tipo e a descrição', () => {
    const fonte = `
/** Sobrepõe as mensagens. */
export function provideX() {}
export const Y = 1;
/** Uma interface. */
export interface Z {}`;
    const s = simbolosDaFonte(fonte);
    expect(s.get('provideX')).toEqual({ tipo: 'function', descricao: 'Sobrepõe as mensagens.' });
    expect(s.get('Y')).toEqual({ tipo: 'const', descricao: '' });
    expect(s.get('Z')?.tipo).toBe('interface');
  });
});

describe('declaracoesDaFonte', () => {
  const fonte = `
/**
 * Um botão.
 */
@Component({
  selector: 'evo-x',
  template: \`<b>{{ a() }}</b>\`,
  host: { '[attr.x]': 'y()' },
})
export class EvoX<T = unknown> {
  /** Texto. */
  readonly a = input('');
  readonly b = input.required<number>();
  readonly c = model<T | null>(null);
  readonly d = output<string>();
  readonly e = input(false, { transform: booleanAttribute });
  private readonly f = signal(0);
}

@Directive({ selector: 'ng-template[evoY]' })
export class EvoY {}
`;

  it('encontra componentes e directivas, com selector e descrição', () => {
    const d = declaracoesDaFonte(fonte);
    expect(d.map((x) => [x.classe, x.selector, x.tipo])).toEqual([
      ['EvoX', 'evo-x', 'Component'],
      ['EvoY', 'ng-template[evoY]', 'Directive'],
    ]);
    expect(d[0].descricao).toBe('Um botão.');
  });

  it('lista input/model/output com tipo, omissão e obrigatoriedade', () => {
    const [x] = declaracoesDaFonte(fonte);
    expect(x.membros).toEqual([
      {
        nome: 'a',
        tipo: 'input',
        obrigatorio: false,
        descricao: 'Texto.',
        generico: '',
        omissao: "''",
      },
      {
        nome: 'b',
        tipo: 'input',
        obrigatorio: true,
        descricao: '',
        generico: 'number',
        omissao: '',
      },
      {
        nome: 'c',
        tipo: 'model',
        obrigatorio: false,
        descricao: '',
        generico: 'T | null',
        omissao: 'null',
      },
      {
        nome: 'd',
        tipo: 'output',
        obrigatorio: false,
        descricao: '',
        generico: 'string',
        omissao: '',
      },
      {
        nome: 'e',
        tipo: 'input',
        obrigatorio: false,
        descricao: '',
        generico: '',
        omissao: 'false',
      },
    ]);
  });
});

describe('assinatura', () => {
  it('lida com genéricos aninhados, funções e strings com vírgulas', () => {
    const t = '<Readonly<Record<string, X>> | null>(null)';
    expect(assinatura(t, 0)).toEqual({
      generico: 'Readonly<Record<string, X>> | null',
      omissao: 'null',
    });
    expect(assinatura('<(a: V) => boolean>(Object.is)', 0)).toEqual({
      generico: '(a: V) => boolean',
      omissao: 'Object.is',
    });
    expect(assinatura("('a, b', { x: 1 })", 0)).toEqual({ generico: '', omissao: "'a, b'" });
  });
});

describe('metaDosTokens', () => {
  it('lê a categoria e os tokens com o fallback', () => {
    const fonte = `export const m: EvoComponentMeta = {
      id: 'x', category: 'Formulário',
      tokens: [
        { name: 'x-bg', label: 'Fundo', type: 'color', fallback: '--evo-color-surface' },
        { name: 'x-size', label: 'Tamanho', type: 'length', min: 0 },
      ],
    };`;
    expect(metaDosTokens(fonte)).toEqual({
      categoria: 'Formulário',
      tokens: [
        { nome: 'x-bg', fallback: '--evo-color-surface' },
        { nome: 'x-size', fallback: '' },
      ],
    });
  });
});

describe('agruparTokens', () => {
  it('agrupa pelo prefixo, respeitando prefixos compostos', () => {
    const g = agruparTokens(
      ['text-field-ring', 'text-x', 'color-primary', 'select-bg'],
      ['text-field'],
    );
    expect([...g]).toEqual([
      ['color', ['color-primary']],
      ['select', ['select-bg']],
      ['text-field', ['text-field-ring']],
      ['text', ['text-x']],
    ]);
  });
});

describe('celula', () => {
  it('escapa barras verticais', () => {
    expect(celula('a | b')).toBe('a \\| b');
  });
});
