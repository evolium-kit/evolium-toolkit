// @ts-check
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

/**
 * Gera o registo dos componentes da toolkit para o Theme Studio.
 *
 * O Studio corre no browser e não tem acesso ao sistema de ficheiros, por isso
 * a "descoberta automática" acontece aqui, no build: cada pasta de
 * `components/src/lib/` com um `<nome>.tokens.ts` é um componente, e entra no
 * registo sem ninguém o acrescentar a uma lista.
 *
 * Por componente, junta aos metadados:
 * - `preview`, se existir `<nome>.preview.ts` (a classe exportada);
 * - `docs`, se existir `README.md`, convertido aqui em HTML — assim o pacote
 *   publicado não precisa de um parser de markdown em runtime.
 *
 * Gera também `core/src/lib/generated/token-names.ts`, os nomes de token que
 * `[evoTokens]` aceita (ver `gerarNomesDeTokens`).
 *
 * Escreve em `components/src/lib/generated/`, que está no `.gitignore`: é
 * sempre derivado das pastas, nunca editado à mão. Corre antes de `build:lib`,
 * `test:lib`, `start` e `build` (scripts `pre*` do package.json).
 *
 * Uso: node tools/generate-component-registry.mjs
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const lib = join(raiz, 'projects', 'toolkit', 'components', 'src', 'lib');
const destino = join(lib, 'generated');

const CABECALHO =
  '/* GERADO por tools/generate-component-registry.mjs — não editar: as alterações perdem-se. */';

const falhar = (/** @type {string} */ mensagem) => {
  console.error(`[evo] ${mensagem}`);
  process.exit(1);
};

/**
 * Links relativos de um README (`../theme/README.md`) não levam a lado nenhum
 * dentro do Studio. Ficam só com o texto; os absolutos e as âncoras mantêm-se.
 */
const markdown = new Marked({
  gfm: true,
  renderer: {
    link({ href, tokens }) {
      if (/^([a-z][a-z0-9+.-]*:|#)/i.test(href)) return false;
      return this.parser.parseInline(tokens);
    },
  },
});

/** @typedef {{ pasta: string, meta: string, preview: string | null, docs: boolean }} Componente */

/** @type {Componente[]} */
const componentes = [];

const pastas = (await readdir(lib, { withFileTypes: true }))
  .filter((e) => e.isDirectory() && e.name !== 'generated')
  .map((e) => e.name)
  .sort();

for (const pasta of pastas) {
  const tokens = join(lib, pasta, `${pasta}.tokens.ts`);
  if (!existsSync(tokens)) continue;

  const fonteTokens = await readFile(tokens, 'utf-8');
  const meta = fonteTokens.match(/export const (\w+)\s*:\s*EvoComponentMeta\b/)?.[1];
  if (!meta) falhar(`${rel(tokens)}: não encontrei "export const x: EvoComponentMeta"`);

  let preview = null;
  const ficheiroPreview = join(lib, pasta, `${pasta}.preview.ts`);
  if (existsSync(ficheiroPreview)) {
    preview = (await readFile(ficheiroPreview, 'utf-8')).match(/export class (\w+)/)?.[1] ?? null;
    if (!preview) falhar(`${rel(ficheiroPreview)}: não encontrei "export class …"`);
  } else {
    console.warn(`[evo] ${pasta}: sem ${pasta}.preview.ts — o Studio não terá pré-visualização.`);
  }

  const readme = join(lib, pasta, 'README.md');
  const docs = existsSync(readme);
  if (docs) {
    const html = await markdown.parse(await readFile(readme, 'utf-8'));
    await escrever(`${pasta}.docs.ts`, `${CABECALHO}\n\nexport default ${JSON.stringify(html)};\n`);
  }

  componentes.push({ pasta, meta: /** @type {string} */ (meta), preview, docs });
}

if (componentes.length === 0) falhar(`nenhum *.tokens.ts encontrado em ${rel(lib)}`);

const imports = componentes
  .map((c) => `import { ${c.meta} } from '../${c.pasta}/${c.pasta}.tokens';`)
  .join('\n');

const entradas = componentes
  .map((c) => {
    const campos = [`    ...${c.meta},`];
    if (c.preview) {
      campos.push(
        `    preview: () => import('../${c.pasta}/${c.pasta}.preview').then((m) => m.${c.preview}),`,
      );
    }
    if (c.docs) {
      campos.push(`    docs: () => import('./${c.pasta}.docs').then((m) => m.default),`);
    }
    return `  {\n${campos.join('\n')}\n  },`;
  })
  .join('\n');

await escrever(
  'registry.ts',
  `${CABECALHO}

import { EvoComponentMeta } from '@evolium-kit/toolkit/core';
${imports}

/** Metadados de todos os componentes da toolkit, descobertos pelas pastas. */
export const EVO_BUILTIN_COMPONENT_META: readonly EvoComponentMeta[] = [
${entradas}
];
`,
);

await gerarNomesDeTokens();

// Um README ou componente apagado não pode deixar um .docs.ts órfão para trás.
const esperados = new Set([
  'registry.ts',
  ...componentes.filter((c) => c.docs).map((c) => `${c.pasta}.docs.ts`),
]);
for (const ficheiro of await readdir(destino)) {
  if (!esperados.has(ficheiro)) await rm(join(destino, ficheiro));
}

console.log(
  `[evo] registo de componentes: ${componentes.length} (${componentes.map((c) => c.pasta).join(', ')})`,
);

// ================================================================== auxiliares

function rel(/** @type {string} */ caminho) {
  return relative(raiz, caminho).replaceAll('\\', '/');
}

/**
 * Gera `core/src/lib/generated/token-names.ts`: a lista de tokens que
 * `[evoTokens]` aceita, e que o editor oferece em autocomplete.
 *
 * A fonte é o CSS, e não os `.tokens.ts`: os metadados só listam o que o Studio
 * edita, mas há tokens legítimos fora deles (`field-hint-fg`,
 * `input-border-width`, os dos shells). Entra todo o `--evo-*` declarado em
 * `styles/` ou lido por um `var(--evo-…)` em components, layouts ou pages —
 * por isso um recurso novo fica com autocomplete sem registar nada.
 *
 * Não cria dependência de /core para cima: é uma lista de strings, sem imports.
 */
async function gerarNomesDeTokens() {
  const toolkit = join(raiz, 'projects', 'toolkit');
  const fontes = [
    join(toolkit, 'styles'),
    join(toolkit, 'components', 'src'),
    join(toolkit, 'layouts', 'src'),
    join(toolkit, 'pages', 'src'),
  ];

  /** @type {Set<string>} */
  const nomes = new Set();
  for (const pasta of fontes) {
    if (!existsSync(pasta)) continue;
    for (const entrada of await readdir(pasta, { recursive: true, withFileTypes: true })) {
      if (!entrada.isFile() || !/\.(css|ts)$/.test(entrada.name)) continue;
      if (entrada.name.endsWith('.spec.ts')) continue;
      const caminho = join(entrada.parentPath, entrada.name);
      if (caminho.includes(`${join('lib', 'generated')}`)) continue;

      const fonte = await readFile(caminho, 'utf-8');
      for (const m of fonte.matchAll(/var\(\s*--evo-([a-z0-9-]+)/g)) nomes.add(m[1]);
      // Declarações só contam nas folhas globais: um componente nunca declara
      // os próprios tokens (Regra 1), e um `--evo-x:` num .ts seria um override.
      if (pasta === fontes[0]) {
        for (const m of fonte.matchAll(/(?:^|[\s;{])--evo-([a-z0-9-]+)\s*:/g)) nomes.add(m[1]);
      }
    }
  }

  if (nomes.size === 0) falhar('nenhum token --evo-* encontrado no CSS da toolkit');

  const linhas = [...nomes].sort().map((n) => `  '${n}': true;`);
  await escrever(
    'token-names.ts',
    `${CABECALHO}

/**
 * Tokens conhecidos pela toolkit, extraídos do CSS. Usar \`EvoTokenNames\`
 * (token-names.ts), que é a interface pública e extensível.
 */
export interface EvoBuiltinTokenNames {
${linhas.join('\n')}
}
`,
    join(toolkit, 'core', 'src', 'lib', 'generated'),
  );

  console.log(`[evo] nomes de tokens para [evoTokens]: ${nomes.size}`);
}

/** Só escreve se mudou, para não disparar rebuilds do `watch` sem razão. */
async function escrever(
  /** @type {string} */ nome,
  /** @type {string} */ conteudo,
  /** @type {string} */ pasta = destino,
) {
  await mkdir(pasta, { recursive: true });
  const ficheiro = join(pasta, nome);
  const actual = existsSync(ficheiro) ? await readFile(ficheiro, 'utf-8') : null;
  if (actual !== conteudo) await writeFile(ficheiro, conteudo, 'utf-8');
}
