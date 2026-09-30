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

/** Só escreve se mudou, para não disparar rebuilds do `watch` sem razão. */
async function escrever(/** @type {string} */ nome, /** @type {string} */ conteudo) {
  await mkdir(destino, { recursive: true });
  const ficheiro = join(destino, nome);
  const actual = existsSync(ficheiro) ? await readFile(ficheiro, 'utf-8') : null;
  if (actual !== conteudo) await writeFile(ficheiro, conteudo, 'utf-8');
}
