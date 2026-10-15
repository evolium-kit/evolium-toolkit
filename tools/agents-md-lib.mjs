// @ts-check

/**
 * Partes puras do `tools/generate-agents-md.mjs`: ler o código-fonte da
 * toolkit por expressões regulares e escrever markdown. Sem disco, para
 * poderem ser testadas sozinhas (`tools/agents-md-lib.spec.mjs`).
 *
 * Não é um parser de TypeScript: assenta nas convenções da toolkit (ver
 * "Contrato do componente" em components/README.md) — `readonly x = input(…)`,
 * decorador seguido de `export class`, classe fechada por `}` na coluna 0.
 * Um ficheiro fora dessas convenções não parte o build: simplesmente entra no
 * guia com menos detalhe.
 */

/**
 * Os nomes exportados por um `.d.ts` agregado do ng-packagr (as linhas
 * `export { … };` e `export type { … };` no fim do ficheiro).
 *
 * @param {string} dts
 * @returns {{ valores: string[], tipos: string[] }}
 */
export function exportsDoDts(dts) {
  /** @param {RegExp} re */
  const recolher = (re) =>
    [...dts.matchAll(re)].flatMap((m) =>
      m[1]
        .split(',')
        .map(
          (n) =>
            n
              .trim()
              .split(/\s+as\s+/)
              .pop() ?? '',
        )
        .filter(Boolean),
    );
  return {
    valores: recolher(/^export \{([^}]*)\};?$/gm),
    tipos: recolher(/^export type \{([^}]*)\};?$/gm),
  };
}

/**
 * A primeira frase de um bloco JSDoc, numa linha, sem marcação.
 *
 * @param {string | undefined} bloco  o interior de `/** … *\/`
 */
export function resumoJsDoc(bloco) {
  if (!bloco) return '';
  const texto = bloco
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => !l.startsWith('@'))
    .join(' ')
    // Corta antes de exemplos de código: não cabem numa linha de tabela.
    .split('```')[0]
    .replace(/\s+/g, ' ')
    .trim();
  const frase = texto.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? texto;
  return frase.length > 160 ? `${frase.slice(0, 157)}…` : frase;
}

/**
 * Símbolos exportados num ficheiro-fonte, com a primeira frase do JSDoc.
 *
 * @param {string} fonte
 * @returns {Map<string, { tipo: string, descricao: string }>}
 */
export function simbolosDaFonte(fonte) {
  const re =
    /(?:\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*)?export (?:declare )?(?:abstract )?(?:async )?(const|function|class|interface|type|enum) (\w+)/g;
  /** @type {Map<string, { tipo: string, descricao: string }>} */
  const simbolos = new Map();
  for (const m of fonte.matchAll(re)) {
    simbolos.set(m[3], { tipo: m[2], descricao: resumoJsDoc(m[1]) });
  }
  return simbolos;
}

/**
 * @typedef {{ nome: string, tipo: 'input' | 'model' | 'output', obrigatorio: boolean, descricao: string, generico: string, omissao: string }} Membro
 * @typedef {{ classe: string, selector: string, tipo: 'Component' | 'Directive', descricao: string, membros: Membro[] }} Declaracao
 */

/**
 * Componentes e directivas de um ficheiro: selector, e os `input()`,
 * `model()` e `output()` com a primeira frase do JSDoc de cada um.
 *
 * @param {string} fonte
 * @returns {Declaracao[]}
 */
export function declaracoesDaFonte(fonte) {
  const re =
    /(?:\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*)?@(Component|Directive)\(\{([\s\S]*?)\}\)\s*export class (\w+)/g;
  /** @type {Declaracao[]} */
  const declaracoes = [];
  for (const m of fonte.matchAll(re)) {
    const selector = m[3].match(/selector:\s*'([^']+)'/)?.[1];
    if (!selector) continue;
    const inicio = /** @type {number} */ (m.index) + m[0].length;
    const fim = fonte.indexOf('\n}', inicio);
    const corpo = fonte.slice(inicio, fim === -1 ? undefined : fim);
    declaracoes.push({
      classe: m[4],
      selector,
      tipo: /** @type {'Component' | 'Directive'} */ (m[2]),
      descricao: resumoJsDoc(m[1]),
      membros: membrosDoCorpo(corpo),
    });
  }
  return declaracoes;
}

/** @param {string} corpo */
function membrosDoCorpo(corpo) {
  const re =
    /(?:\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*)?readonly (\w+) = (input|model|output)(\.required)?\s*(?=[<(])/g;
  return [...corpo.matchAll(re)].map((m) => {
    const { generico, omissao } = assinatura(corpo, /** @type {number} */ (m.index) + m[0].length);
    return {
      nome: m[2],
      tipo: /** @type {'input' | 'model' | 'output'} */ (m[3]),
      obrigatorio: !!m[4],
      descricao: resumoJsDoc(m[1]),
      generico,
      omissao,
    };
  });
}

/**
 * Lê `<T>(omissão, …)` a partir de `pos`: o tipo genérico e o primeiro
 * argumento, contando parênteses, chavetas e `<>` para não cortar a meio de
 * `input<Record<string, X>>({})`. Strings e templates são saltados inteiros.
 *
 * @param {string} texto
 * @param {number} pos
 */
export function assinatura(texto, pos) {
  let i = pos;
  let generico = '';
  if (texto[i] === '<') {
    const fim = fechar(texto, i, '<', '>');
    generico = texto
      .slice(i + 1, fim)
      .replace(/\s+/g, ' ')
      .trim();
    i = fim + 1;
  }
  let omissao = '';
  if (texto[i] === '(') {
    let nivel = 0;
    let j = i + 1;
    for (; j < texto.length; j++) {
      const c = texto[j];
      if (c === "'" || c === '"' || c === '`') {
        j = texto.indexOf(c, j + 1);
        if (j === -1) break;
        continue;
      }
      if (c === '>' && texto[j - 1] === '=') continue;
      if ('([{<'.includes(c)) nivel++;
      else if (')]}>'.includes(c)) {
        if (nivel === 0) break;
        nivel--;
      } else if (c === ',' && nivel === 0) break;
    }
    omissao = texto
      .slice(i + 1, j)
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Uma omissão longa (função, objecto) não ajuda numa tabela.
  if (omissao.length > 40) omissao = '…';
  return { generico, omissao };
}

/**
 * @param {string} texto
 * @param {number} abre  índice do carácter de abertura
 * @param {string} a
 * @param {string} f
 */
function fechar(texto, abre, a, f) {
  let nivel = 0;
  for (let i = abre; i < texto.length; i++) {
    // `=>` dentro de um tipo de função não fecha nada.
    if (texto[i] === '>' && texto[i - 1] === '=') continue;
    if (texto[i] === a) nivel++;
    else if (texto[i] === f && --nivel === 0) return i;
  }
  return texto.length;
}

/**
 * Metadados de um `<nome>.tokens.ts`: categoria e tokens (nome → fallback).
 *
 * @param {string} fonte
 */
export function metaDosTokens(fonte) {
  const categoria = fonte.match(/category:\s*'([^']+)'/)?.[1] ?? '';
  const tokens = [...fonte.matchAll(/\{\s*name:\s*'([^']+)'([\s\S]*?)\}/g)].map((m) => ({
    nome: m[1],
    fallback: m[2].match(/fallback:\s*'([^']+)'/)?.[1] ?? '',
  }));
  return { categoria, tokens };
}

/**
 * Agrupa nomes de token (sem `--evo-`) pelo prefixo — o componente
 * (`select-panel-bg` → `select`) ou a família semântica (`color-primary` →
 * `color`). Os prefixos compostos conhecidos (`text-field`, `form-field`…)
 * passam em `compostos`.
 *
 * @param {string[]} nomes
 * @param {string[]} compostos
 * @returns {Map<string, string[]>}
 */
export function agruparTokens(nomes, compostos = []) {
  const ordenados = [...compostos].sort((a, b) => b.length - a.length);
  /** @type {Map<string, string[]>} */
  const grupos = new Map();
  for (const nome of [...nomes].sort()) {
    const prefixo =
      ordenados.find((p) => nome === p || nome.startsWith(`${p}-`)) ?? nome.split('-')[0];
    grupos.set(prefixo, [...(grupos.get(prefixo) ?? []), nome]);
  }
  return grupos;
}

/** Escapa `|` para não partir uma tabela markdown. */
export function celula(/** @type {string} */ texto) {
  return texto.replace(/\|/g, '\\|');
}
