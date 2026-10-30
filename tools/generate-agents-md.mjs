// @ts-check
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  agruparTokens,
  celula,
  declaracoesDaFonte,
  exportsDoDts,
  metaDosTokens,
  simbolosDaFonte,
} from './agents-md-lib.mjs';

/**
 * Gera `dist/toolkit/AGENTS.md`: o índice da toolkit para agentes de IA que
 * trabalham num projecto consumidor (ver docs/ai-context.md).
 *
 * Corre no fim do `build:lib`, depois do ng-packagr, porque a lista do que é
 * público vem dos `.d.ts` agregados (`dist/toolkit/types/*.d.ts`) — é a fonte
 * de verdade do que o consumidor consegue importar. O detalhe (selectors,
 * inputs, tokens, descrições) vem do código-fonte.
 *
 * Também copia para o pacote a documentação conceptual que o guia referencia
 * (`docs/getting-started.md`, `docs/theming.md`, `docs/variable-tokens.md`,
 * `docs/plugins.md`) e o
 * `CHANGELOG.md`.
 *
 * A parte escrita à mão (como ler, regras para quem consome) está em
 * `projects/toolkit/AGENTS.base.md`.
 *
 * Uso: node tools/generate-agents-md.mjs   (depois de `ng build toolkit`)
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const toolkit = join(raiz, 'projects', 'toolkit');
const dist = join(raiz, 'dist', 'toolkit');

const ENTRY_POINTS = [
  ['core', 'Tipos, tokens de DI, `[evoTokens]`, metadados de componentes'],
  ['theme', 'Design tokens, `EvoThemeStore`, modo escuro, persistência'],
  ['components', 'Componentes de UI temáveis'],
  ['layouts', 'Shells de aplicação'],
  ['pages', 'Páginas prontas (autenticação, 404, Theme Studio)'],
  ['services', 'Kernel de serviços por plugins, autenticação, HTTP'],
  ['crud', 'CRUD sobre TanStack Query: resource, controller com modais, página, formulário'],
];

/** Documentos do repositório que vão para o pacote, para o guia os poder citar. */
const DOCS = [
  ['docs/getting-started.md', 'docs/getting-started.md'],
  ['docs/theming.md', 'docs/theming.md'],
  ['docs/variable-tokens.md', 'docs/variable-tokens.md'],
  ['docs/index-componentes.md', 'docs/index-componentes.md'],
  ['docs/plugins.md', 'docs/plugins.md'],
  ['CHANGELOG.md', 'CHANGELOG.md'],
];

const falhar = (/** @type {string} */ mensagem) => {
  console.error(`[evo] AGENTS.md: ${mensagem}`);
  process.exit(1);
};

if (!existsSync(join(dist, 'package.json')))
  falhar('dist/toolkit não existe — correr ng build toolkit');

const versao = JSON.parse(await readFile(join(dist, 'package.json'), 'utf-8')).version;
const base = (await readFile(join(toolkit, 'AGENTS.base.md'), 'utf-8')).replaceAll(
  '{{VERSAO}}',
  versao,
);

// ------------------------------------------------------------ o que é público

/** @type {Map<string, { valores: Set<string>, tipos: Set<string> }>} */
const publicos = new Map();
for (const [ep] of ENTRY_POINTS) {
  const dts = join(dist, 'types', `evolium-kit-toolkit-${ep}.d.ts`);
  if (!existsSync(dts)) falhar(`${rel(dts)} em falta`);
  const { valores, tipos } = exportsDoDts(await readFile(dts, 'utf-8'));
  if (valores.length + tipos.length === 0) falhar(`${rel(dts)} sem exports`);
  publicos.set(ep, { valores: new Set(valores), tipos: new Set(tipos) });
}

const ePublico = (/** @type {string} */ ep, /** @type {string} */ nome) =>
  !!publicos.get(ep)?.valores.has(nome);

// ------------------------------------------------------------------- secções

/** @type {string[]} */
const seccoes = [];
/** Caminhos (relativos ao dist) citados no guia; todos têm de existir. */
const citados = new Set(['README.md', 'package.json']);
const citar = (/** @type {string} */ caminho) => {
  citados.add(caminho);
  return `\`${caminho}\``;
};

seccoes.push(seccaoEntryPoints());
seccoes.push(await seccaoComponentes());
seccoes.push(await seccaoDeclaracoes('layouts', 'Layouts (shells)'));
seccoes.push(await seccaoDeclaracoes('pages', 'Páginas prontas'));
seccoes.push(await seccaoTokens());
seccoes.push(await seccaoGeradores());
seccoes.push(await seccaoApi());

// ---------------------------------------------------------------- documentos

await mkdir(join(dist, 'docs'), { recursive: true });
for (const [de, para] of DOCS) {
  const origem = join(raiz, de);
  if (!existsSync(origem)) falhar(`${de} em falta no repositório`);
  await copyFile(origem, join(dist, para));
  citados.add(para);
}

for (const caminho of citados) {
  if (!existsSync(join(dist, caminho))) falhar(`o guia cita ${caminho}, que não existe no dist`);
}

const conteudo = `${base.trimEnd()}\n\n${seccoes.join('\n\n')}\n`;
await writeFile(join(dist, 'AGENTS.md'), conteudo, 'utf-8');

console.log(
  `[evo] AGENTS.md ${versao}: ${ENTRY_POINTS.length} entry points, ${citados.size} ficheiros citados, ` +
    `${Math.round(conteudo.length / 1024)} KB.`,
);

// ================================================================== secções

function seccaoEntryPoints() {
  const linhas = ENTRY_POINTS.map(
    ([ep, conteudo]) =>
      `| \`@evolium-kit/toolkit/${ep}\` | ${conteudo} | ${citar(`${ep}/README.md`)} | \`types/evolium-kit-toolkit-${ep}.d.ts\` |`,
  );
  return `## Entry points

| Import | Conteúdo | Documentação | Tipos |
| ------ | -------- | ------------ | ----- |
${linhas.join('\n')}

Folhas de estilo (importadas pelo \`ng add\` no \`styles.css\`):
\`styles/evolium-theme.css\`, \`styles/evolium-components.css\`, \`styles/evolium-layouts.css\`.`;
}

async function seccaoComponentes() {
  const lib = join(toolkit, 'components', 'src', 'lib');
  const pastas = (await readdir(lib, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && e.name !== 'generated')
    .map((e) => e.name)
    .sort();

  /** @type {string[]} */
  const resumo = [];
  /** @type {string[]} */
  const detalhe = [];

  for (const pasta of pastas) {
    const ficheiros = (await readdir(join(lib, pasta))).filter(
      (f) => f.endsWith('.ts') && !/\.(spec|preview|tokens)\.ts$/.test(f),
    );
    const declaracoes = [];
    for (const f of ficheiros) {
      declaracoes.push(...declaracoesDaFonte(await readFile(join(lib, pasta, f), 'utf-8')));
    }
    const publicas = declaracoes.filter((d) => ePublico('components', d.classe));
    if (!publicas.length) continue;

    const ficheiroTokens = join(lib, pasta, `${pasta}.tokens.ts`);
    const meta = existsSync(ficheiroTokens)
      ? metaDosTokens(await readFile(ficheiroTokens, 'utf-8'))
      : { categoria: '', tokens: [] };
    const readme = existsSync(join(lib, pasta, 'README.md'))
      ? `components/src/lib/${pasta}/README.md`
      : 'components/README.md';

    for (const d of publicas) {
      resumo.push(
        `| \`${d.classe}\` | \`${celula(d.selector)}\` | ${meta.categoria || '—'} | ${celula(d.descricao) || '—'} | ${citar(readme)} |`,
      );
      detalhe.push(blocoDeclaracao(d, readme));
    }
    if (meta.tokens.length) {
      detalhe.push(
        `Tokens de \`${pasta}\` editáveis no Theme Studio (usar em \`[evoTokens]\` com este nome):\n\n` +
          meta.tokens
            .map((t) => `- \`${t.nome}\`${t.fallback ? ` — herda de \`${t.fallback}\`` : ''}`)
            .join('\n'),
      );
    }
  }

  return `## Componentes — \`@evolium-kit/toolkit/components\`

Antes de criar um componente de UI, confirmar se já existe aqui. O README de
cada um tem a API completa, exemplos (Reactive Forms incluído), os tokens e a
acessibilidade.

| Classe | Selector | Categoria | Para quê | README |
| ------ | -------- | --------- | -------- | ------ |
${resumo.join('\n')}

### Detalhe por componente

${detalhe.join('\n\n')}`;
}

/**
 * @param {string} ep
 * @param {string} titulo
 */
async function seccaoDeclaracoes(ep, titulo) {
  const declaracoes = [];
  for (const f of await fontesDe(ep)) {
    declaracoes.push(...declaracoesDaFonte(await readFile(f, 'utf-8')));
  }
  const publicas = declaracoes
    .filter((d) => ePublico(ep, d.classe))
    .sort((a, b) => a.classe.localeCompare(b.classe));
  const readme = `${ep}/README.md`;
  return `## ${titulo} — \`@evolium-kit/toolkit/${ep}\`

Documentação completa em ${citar(readme)}.

${publicas.map((d) => blocoDeclaracao(d, readme)).join('\n\n')}`;
}

/**
 * @param {import('./agents-md-lib.mjs').Declaracao} d
 * @param {string} readme
 */
function blocoDeclaracao(d, readme) {
  const cabecalho = `#### \`${d.classe}\` — \`${d.selector}\`\n\n${d.descricao ? `${d.descricao} ` : ''}Ver ${citar(readme)}.`;
  if (!d.membros.length) return cabecalho;
  const linhas = d.membros.map((m) => {
    const tipo = [
      m.generico && `\`${celula(m.generico)}\``,
      m.omissao && `\`${celula(m.omissao)}\``,
    ]
      .filter(Boolean)
      .join(' · ');
    return `| \`${m.nome}\` | \`${m.tipo}()\`${m.obrigatorio ? ' obrigatório' : ''} | ${tipo || '—'} | ${celula(m.descricao) || '—'} |`;
  });
  return `${cabecalho}\n\n| Nome | Forma | Tipo · omissão | Descrição |\n| ---- | ----- | -------------- | --------- |\n${linhas.join('\n')}`;
}

async function seccaoTokens() {
  const tema = await readFile(join(toolkit, 'styles', 'evolium-theme.css'), 'utf-8');
  const declarados = new Set(
    [...tema.matchAll(/(?:^|[\s;{])--evo-([a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );
  const semanticos = [...declarados].filter((n) => !/^(palette|scale)-/.test(n));

  const geradoTokens = join(toolkit, 'core', 'src', 'lib', 'generated', 'token-names.ts');
  if (!existsSync(geradoTokens))
    falhar(`${rel(geradoTokens)} em falta — correr npm run gen:registry`);
  const todos = [...(await readFile(geradoTokens, 'utf-8')).matchAll(/'([a-z0-9-]+)': true/g)].map(
    (m) => m[1],
  );
  const deComponentes = todos.filter((n) => !declarados.has(n));

  const compostos = [
    ...(await readdir(join(toolkit, 'components', 'src', 'lib'))),
    ...(await readdir(join(toolkit, 'layouts', 'src', 'lib'))),
    ...(await readdir(join(toolkit, 'pages', 'src', 'lib'))),
  ].filter((n) => n.includes('-') && !n.includes('.'));

  const lista = (/** @type {Map<string, string[]>} */ grupos) =>
    [...grupos]
      .map(([g, nomes]) => `- **${g}**: ${nomes.map((n) => `\`${n}\``).join(', ')}`)
      .join('\n');

  return `## Tokens de tema

Escritos aqui **sem** o prefixo \`--evo-\`: é a forma curta que \`[evoTokens]\`
e \`EvoThemeStore.setToken()\` aceitam. Em CSS: \`var(--evo-<nome>)\`.
Detalhe da cascata em ${citar('docs/theming.md')} e ${citar('theme/README.md')}.

### Semânticos (usar estes no CSS do projecto)

${lista(agruparTokens(semanticos))}

Os primitivos (\`palette-*\`, \`scale-*\`) existem, mas **não** se usam
directamente: um componente só refere semânticos.

### Por componente, layout e página

${lista(agruparTokens(deComponentes, compostos))}

A lista completa e verificada na compilação é a interface \`EvoTokenNames\`
(\`@evolium-kit/toolkit/core\`); um projecto acrescenta os seus com
\`declare module\`.`;
}

async function seccaoGeradores() {
  const colecao = JSON.parse(await readFile(join(dist, 'schematics', 'collection.json'), 'utf-8'));
  const linhas = Object.entries(colecao.schematics).map(
    ([nome, s]) =>
      `| \`ng g @evolium-kit/toolkit:${nome}\` | ${(s.aliases ?? []).map((a) => `\`${a}\``).join(', ') || '—'} | ${celula(s.description ?? '')} |`,
  );
  return `## Geradores

Correr com \`--dry-run\` primeiro para ver o que é criado.

| Comando | Aliases | O que faz |
| ------- | ------- | --------- |
${linhas.join('\n')}`;
}

async function seccaoApi() {
  /** @type {string[]} */
  const blocos = [];
  for (const [ep] of ENTRY_POINTS) {
    /** @type {Map<string, { tipo: string, descricao: string }>} */
    const simbolos = new Map();
    for (const f of await fontesDe(ep)) {
      for (const [nome, s] of simbolosDaFonte(await readFile(f, 'utf-8'))) {
        if (!simbolos.has(nome) || !simbolos.get(nome)?.descricao) simbolos.set(nome, s);
      }
    }
    const pub = /** @type {{ valores: Set<string>, tipos: Set<string> }} */ (publicos.get(ep));
    const nomes = [...pub.valores, ...pub.tipos].sort((a, b) => a.localeCompare(b));
    const linhas = nomes.map((n) => {
      const s = simbolos.get(n);
      const tipo = s?.tipo ?? (pub.tipos.has(n) ? 'type' : '—');
      return `| \`${n}\` | ${tipo} | ${celula(s?.descricao ?? '') || '—'} |`;
    });
    blocos.push(
      `### \`@evolium-kit/toolkit/${ep}\`\n\n| Símbolo | Tipo | Descrição |\n| ------- | ---- | --------- |\n${linhas.join('\n')}`,
    );
  }
  return `## Referência da API pública

Tudo o que cada entry point exporta, com a primeira frase da documentação. As
assinaturas exactas estão em \`types/evolium-kit-toolkit-<entry>.d.ts\`.

${blocos.join('\n\n')}`;
}

// ================================================================ auxiliares

/** @param {string} ep */
async function fontesDe(ep) {
  const src = join(toolkit, ep, 'src');
  return (await readdir(src, { recursive: true, withFileTypes: true }))
    .filter(
      (e) => e.isFile() && e.name.endsWith('.ts') && !/\.(spec|preview|docs)\.ts$/.test(e.name),
    )
    .map((e) => join(e.parentPath, e.name))
    .sort();
}

function rel(/** @type {string} */ caminho) {
  return relative(raiz, caminho).replaceAll('\\', '/');
}
