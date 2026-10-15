// @ts-check

/**
 * Partes puras do `tools/publicar.mjs` (sem git, sem processos, sem disco),
 * para poderem ser testadas sozinhas. Ver `tools/publicar-lib.spec.mjs`.
 */

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

/** Cabeçalho da secção de alterações ainda por publicar (Keep a Changelog). */
export const NAO_PUBLICADO = '## [Não publicado]';

/**
 * `v0.2.2` ou `0.2.2` → `0.2.2`. Só `X.Y.Z`: pré-versões (`-beta.1`) não são
 * aceites, porque a tag do workflow (`v*.*.*`) e o fluxo de release não as
 * prevêem.
 *
 * @param {string | undefined} bruto
 * @returns {string}
 */
export function normalizarVersao(bruto) {
  const m = SEMVER.exec((bruto ?? '').trim());
  if (!m) {
    throw new Error(`versão inválida: "${bruto ?? ''}". Usar o formato vX.Y.Z (ex.: v0.2.2).`);
  }
  return m.slice(1, 4).map(Number).join('.');
}

/**
 * Compara duas versões `X.Y.Z`: negativo se `a < b`, 0 se iguais, positivo se `a > b`.
 *
 * @param {string} a
 * @param {string} b
 */
export function compararVersoes(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/**
 * Move o conteúdo de `## [Não publicado]` para uma secção nova
 * `## [versao] - data`, e deixa `[Não publicado]` vazia por cima dela.
 * Mantém o fim de linha do ficheiro (LF ou CRLF).
 *
 * Falha se a secção não existir, se estiver vazia (uma versão sem changelog
 * não se publica), ou se a versão já tiver secção.
 *
 * @param {string} texto  conteúdo do CHANGELOG.md
 * @param {string} versao `X.Y.Z`
 * @param {string} data   `AAAA-MM-DD`
 * @returns {string}
 */
export function prepararChangelog(texto, versao, data) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const linhas = texto.split(/\r?\n/);
  if (linhas.some((l) => l.startsWith(`## [${versao}]`))) {
    throw new Error(`o CHANGELOG.md já tem uma secção para ${versao}.`);
  }
  const { inicio, fim, corpo } = seccaoNaoPublicada(linhas);
  const resto = linhas.slice(fim);
  return [
    ...linhas.slice(0, inicio),
    NAO_PUBLICADO,
    '',
    `## [${versao}] - ${data}`,
    '',
    ...corpo,
    ...(resto.length ? ['', ...resto] : ['']),
  ].join(eol);
}

/**
 * O texto da secção `## [Não publicado]`, sem as linhas em branco das pontas.
 * Falha se a secção não existir ou estiver vazia.
 *
 * @param {string} texto  conteúdo do CHANGELOG.md
 */
export function notasNaoPublicadas(texto) {
  return seccaoNaoPublicada(texto.split(/\r?\n/)).corpo.join('\n');
}

/** @param {string[]} linhas */
function seccaoNaoPublicada(linhas) {
  const inicio = linhas.findIndex((l) => l.trim() === NAO_PUBLICADO);
  if (inicio === -1) {
    throw new Error(`o CHANGELOG.md não tem a secção "${NAO_PUBLICADO}".`);
  }
  let fim = linhas.findIndex((l, i) => i > inicio && l.startsWith('## ['));
  if (fim === -1) fim = linhas.length;

  const corpo = linhas.slice(inicio + 1, fim);
  // Tira linhas em branco no início e no fim, mantendo as do meio.
  while (corpo.length && !corpo[0].trim()) corpo.shift();
  while (corpo.length && !corpo[corpo.length - 1].trim()) corpo.pop();
  if (!corpo.length) {
    throw new Error(
      `a secção "${NAO_PUBLICADO}" do CHANGELOG.md está vazia. ` +
        'Documentar a versão antes de publicar (Keep a Changelog).',
    );
  }
  return { inicio, fim, corpo };
}

/**
 * Troca o `"version"` de um package.json mantendo a formatação do resto.
 *
 * @param {string} texto
 * @param {string} versao
 */
export function trocarVersaoPackageJson(texto, versao) {
  const re = /("version"\s*:\s*")[^"]*(")/;
  if (!re.test(texto)) throw new Error('package.json sem campo "version".');
  return texto.replace(re, `$1${versao}$2`);
}

/** Data local em `AAAA-MM-DD` (não UTC: a data do changelog é a de quem publica). */
export function hoje(agora = new Date()) {
  const p = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
}
