// @ts-check
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Acrescenta um componente, layout, página ou plugin à própria toolkit.
 *
 * Os geradores `ng g @evolium-kit/toolkit:*` foram escritos para projectos
 * consumidores e não servem tal e qual dentro deste workspace:
 *
 * - o CLI procura a collection em `node_modules`, onde a toolkit não está (o
 *   `paths` do tsconfig não conta para schematics);
 * - escrevem por omissão em `src/app/…`, que aqui é o playground;
 * - não sabem que o resultado tem de entrar no `public-api.ts`;
 * - o `resource-plugin` importa de `@evolium-kit/toolkit/services`, o que
 *   dentro de `/services` seria o entry point a importar-se a si próprio.
 *
 * Este script corre os mesmos geradores a partir do `dist` e adapta o
 * resultado às convenções da lib. Os geradores ficam como estão — são o
 * contrato com os consumidores; tudo o que é específico da lib vive aqui.
 *
 * Uso: node tools/new.mjs <component|layout|page|plugin> <nome> [opções do gerador] [--dry-run]
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const toolkit = join(raiz, 'projects', 'toolkit');
const COLLECTION = './dist/toolkit/schematics/collection.json';
const PACOTE = '@evolium-kit/toolkit';

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const classify = (/** @type {string} */ nome) =>
  nome
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');

/**
 * @typedef {object} Tipo
 * @property {string} schematic
 * @property {string} entry         entry point onde o resultado vive
 * @property {(nome: string) => string | null} validar  mensagem de erro, ou null
 * @property {(nome: string) => string} pasta           relativa a <entry>/src/lib
 * @property {(nome: string) => string} exportLinha     linha para o public-api.ts
 * @property {RegExp} grupoExports  o export novo vai a seguir ao último que case com isto
 * @property {(nome: string) => [RegExp, string][]} [renomear]  identificadores a adaptar
 * @property {(nome: string) => string} [resumoRenomes]      o mesmo, legível, para o dry-run
 * @property {(nome: string) => Promise<string[]>} [registarExtra]  devolve os ficheiros alterados
 * @property {(nome: string) => string[]} proximos
 */

/** @type {Record<string, Tipo>} */
const TIPOS = {
  component: {
    schematic: 'ui-component',
    entry: 'components',
    validar: () => null,
    pasta: (n) => n,
    exportLinha: (n) => `export * from './lib/${n}';`,
    grupoExports: /^export \* from '\.\/lib\/.+';$/,
    registarExtra: registarMetaDoComponente,
    proximos: () => [
      'Implementar o componente e os tokens (components/README.md, "As duas regras de ouro").',
      'Acrescentá-lo à tabela da secção "Usar" do components/README.md.',
    ],
  },

  layout: {
    schematic: 'layout',
    entry: 'layouts',
    validar: (n) =>
      n.endsWith('-shell') ? `sem o sufixo: "${n.replace(/-shell$/, '')}" gera ${n}` : null,
    pasta: (n) => `${n}-shell`,
    exportLinha: (n) => `export * from './lib/${n}-shell/evo-${n}-shell';`,
    grupoExports: /^export \* from '\.\/lib\/.+';$/,
    proximos: () => [
      'Implementar o shell (layouts/README.md, "Contrato", "Responsividade", "Acessibilidade").',
      'Acrescentá-lo à tabela e aos exemplos da secção "Usar" do layouts/README.md.',
    ],
  },

  page: {
    schematic: 'page',
    entry: 'pages',
    validar: (n) =>
      n.endsWith('-page') ? `sem o sufixo: "${n.replace(/-page$/, '')}" gera Evo…Page` : null,
    pasta: (n) => n,
    exportLinha: (n) => `export * from './lib/${n}/${n}.page';`,
    // Antes do bloco "Ferramentas de desenvolvimento", que é só o Theme Studio.
    grupoExports: /^export \* from '\.\/lib\/(?!theme-studio).+';$/,
    // O gerador segue a convenção de uma app (`app-x`, `XPage`); a lib usa o prefixo evo.
    renomear: (n) => [
      [new RegExp(`\\b${classify(n)}Page\\b`, 'g'), `Evo${classify(n)}Page`],
      [new RegExp(`'app-${n}'`, 'g'), `'evo-${n}-page'`],
    ],
    resumoRenomes: (n) => `${classify(n)}Page → Evo${classify(n)}Page, app-${n} → evo-${n}-page`,
    proximos: () => [
      'Mover o export no pages/public-api.ts para o grupo certo (Autenticação, Erros, …).',
      'Implementar os quatro estados e o EvoPageCopy (pages/README.md, "Contrato").',
      'Acrescentá-la à tabela da secção "Usar" do pages/README.md, com rota e resource.',
    ],
  },

  plugin: {
    schematic: 'resource-plugin',
    entry: 'services',
    validar: (n) =>
      n.endsWith('s') ? null : `o nome do resource vai no plural (ex.: facturas), recebi "${n}"`,
    pasta: (n) => `plugins/${n}`,
    exportLinha: (n) => `export * from './lib/plugins/${n}';`,
    grupoExports: /^export \* from '\.\/lib\/plugins\/.+';$/,
    /*
     * Tudo o que o plugin exporta acaba no public-api de /services, ao lado de
     * todos os outros plugins: os nomes têm de ser únicos e seguem o `auth`
     * (`EvoAuth`, `EvoAuthApi`, `EvoSession`). O `toDto` genérico colidiria
     * logo no segundo plugin.
     */
    renomear: (n) => {
      const c = classify(n);
      const s = c.replace(/s$/, '');
      return [
        [new RegExp(`\\b${c}(Api|Extensions)?\\b`, 'g'), `Evo${c}$1`],
        [new RegExp(`\\b(Nov)?${s}(Dto)?\\b`, 'g'), `Evo$1${s}$2`],
        [/\btoDto\b/g, `to${s}Dto`],
      ];
    },
    resumoRenomes: (n) => {
      const c = classify(n);
      const s = c.replace(/s$/, '');
      return `${c}[Api|Extensions] → Evo${c}…, [Nov]${s}[Dto] → Evo…${s}…, toDto → to${s}Dto`;
    },
    proximos: (n) => [
      'Implementar modelos, mappers e endpoints (services/README.md, "Checklist").',
      `Acrescentar um exemplo de withPlugin(${n.replace(/-(\w)/g, (_, l) => l.toUpperCase())}Plugin()) à secção "Usar" do services/README.md.`,
    ],
  },
};

// ------------------------------------------------------------------ argumentos
const falhar = (/** @type {string} */ mensagem) => {
  console.error(`[evo] ${mensagem}`);
  process.exit(1);
};

const [nomeTipo, nome, ...resto] = process.argv.slice(2);
const tipo = nomeTipo ? TIPOS[nomeTipo] : undefined;

if (!tipo || !nome || nome.startsWith('-')) {
  falhar(
    `uso: node tools/new.mjs <${Object.keys(TIPOS).join('|')}> <nome> [opções do gerador] [--dry-run]`,
  );
}
if (!KEBAB.test(nome)) falhar(`"${nome}" não é um nome válido — usar kebab-case, ex.: form-field`);

const invalido = tipo.validar(nome);
if (invalido) falhar(invalido);

// O destino é decidido aqui; deixar passar estes dois escreveria fora da lib.
const proibida = resto.find((a) => /^--(path|project)(=|$)/.test(a));
if (proibida) falhar(`${proibida.split('=')[0]} não é aceite: o destino é sempre dentro da lib`);

const dryRun = resto.some((a) => a === '--dry-run' || a === '-d');
const lib = join(toolkit, tipo.entry, 'src', 'lib');
const pasta = join(lib, tipo.pasta(nome));
const pastaRel = relative(raiz, pasta).replaceAll('\\', '/');

if (existsSync(pasta)) falhar(`já existe ${pastaRel}`);

// ---------------------------------------------------------------------- gerar
/**
 * Chama o Node directamente, sem shell: no Windows o `cmd` estraga os
 * argumentos com acentos (a categoria por omissão é "Básicos").
 */
const correr = (/** @type {string[]} */ args) => {
  const r = spawnSync(process.execPath, args, { cwd: raiz, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Os templates vêm do dist; recompilar garante que não se gera de uma versão velha.
correr([
  'node_modules/typescript/bin/tsc',
  '-p',
  'projects/toolkit/schematics/tsconfig.schematics.json',
]);
correr(['tools/copy-schematic-assets.mjs']);
correr([
  'node_modules/@angular/cli/bin/ng.js',
  'generate',
  `${COLLECTION}:${tipo.schematic}`,
  nome,
  `--path=${pastaRel}`,
  ...resto,
]);

const publicApi = join(toolkit, tipo.entry, 'src', 'public-api.ts');
const exportLinha = tipo.exportLinha(nome);

if (dryRun) {
  console.log(`\n[evo] (dry-run) além dos ficheiros acima:`);
  console.log(`  ${relative(raiz, publicApi).replaceAll('\\', '/')}  ${exportLinha}`);
  if (tipo.resumoRenomes) console.log(`  renomear ${tipo.resumoRenomes(nome)}`);
  console.log(`  imports de ${PACOTE}/${tipo.entry} → caminhos relativos`);
  process.exit(0);
}

// -------------------------------------------------------------------- adaptar
const gerados = await listarTs(pasta);
const simbolos = await tabelaDeSimbolos(lib, pasta);

for (const ficheiro of gerados) {
  const original = await readFile(ficheiro, 'utf-8');
  let texto = original;
  for (const [de, para] of tipo.renomear?.(nome) ?? []) texto = texto.replace(de, para);
  texto = relativizarAutoImports(texto, ficheiro, simbolos);
  if (texto !== original) await writeFile(ficheiro, texto, 'utf-8');
}

// ------------------------------------------------------------------- registar
const alterados = [publicApi];
await acrescentarDepoisDoUltimo(publicApi, exportLinha, tipo.grupoExports);

alterados.push(...((await tipo.registarExtra?.(nome)) ?? []));

correr([
  'node_modules/prettier/bin/prettier.cjs',
  '--log-level=warn',
  '--write',
  pasta,
  ...alterados,
]);

console.log(`\n[evo] ${nomeTipo} "${nome}" criado em ${pastaRel}/ e registado:`);
for (const f of alterados) console.log(`  ✔ ${relative(raiz, f).replaceAll('\\', '/')}`);
console.log('\nFalta:');
[
  ...tipo.proximos(nome),
  'Exercitá-lo no playground (src/).',
  'npm run build:lib && npm run test:lib && npm run test:schematics && node tools/verify-dist.mjs',
].forEach((passo, i) => console.log(`  ${i + 1}. ${passo}`));

// ================================================================== auxiliares

/** @returns {Promise<string[]>} todos os .ts debaixo de `dir` */
async function listarTs(/** @type {string} */ dir) {
  const entradas = await readdir(dir, { withFileTypes: true, recursive: true });
  return entradas
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => join(e.parentPath, e.name));
}

/**
 * Símbolo exportado → ficheiro que o declara, dentro do entry point.
 *
 * Construída a partir do código e não de uma lista escrita à mão: um símbolo
 * que mude de ficheiro no kernel continua a ser encontrado.
 */
async function tabelaDeSimbolos(/** @type {string} */ dir, /** @type {string} */ ignorar) {
  /** @type {Map<string, string>} */
  const tabela = new Map();
  const declaracao =
    /^export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;

  for (const ficheiro of await listarTs(dir)) {
    if (ficheiro.startsWith(ignorar) || ficheiro.endsWith('.spec.ts')) continue;
    const texto = await readFile(ficheiro, 'utf-8');
    for (const m of texto.matchAll(declaracao)) {
      if (!tabela.has(m[1])) tabela.set(m[1], ficheiro);
    }
  }
  return tabela;
}

function caminhoRelativo(/** @type {string} */ de, /** @type {string} */ para) {
  const r = relative(dirname(de), para).replaceAll('\\', '/').replace(/\.ts$/, '');
  return r.startsWith('.') ? r : `./${r}`;
}

/**
 * Dentro de um entry point, `import … from '@evolium-kit/toolkit/<entry>'` é
 * um ciclo que o ng-packagr recusa. Troca cada import desses — e o alvo de um
 * `declare module` — pelo caminho relativo do ficheiro que declara o símbolo.
 */
function relativizarAutoImports(
  /** @type {string} */ texto,
  /** @type {string} */ ficheiro,
  /** @type {Map<string, string>} */ simbolos,
) {
  const alvo = `${PACOTE}/${tipo?.entry}`.replaceAll('/', '\\/');
  const importRe = new RegExp(`import\\s+(type\\s+)?\\{([^}]*)\\}\\s+from\\s+'${alvo}';`, 'g');

  const localizar = (/** @type {string} */ simbolo) => {
    const onde = simbolos.get(simbolo);
    if (!onde)
      falhar(`${relative(raiz, ficheiro)}: "${simbolo}" não é declarado em /${tipo?.entry}`);
    return caminhoRelativo(ficheiro, /** @type {string} */ (onde));
  };

  texto = texto.replace(importRe, (_, soTipos = '', lista) => {
    /** @type {Map<string, string[]>} */
    const porModulo = new Map();
    for (const parte of lista
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)) {
      const modulo = localizar(parte.split(/\s+as\s+/)[0].replace(/^type\s+/, ''));
      porModulo.set(modulo, [...(porModulo.get(modulo) ?? []), parte]);
    }
    return [...porModulo]
      .map(([modulo, nomes]) => `import ${soTipos}{ ${nomes.join(', ')} } from '${modulo}';`)
      .join('\n');
  });

  // O `declare module` tem de apontar para o ficheiro que declara a interface aumentada.
  const declareRe = new RegExp(`declare module '${alvo}'(\\s*\\{\\s*interface\\s+(\\w+))`, 'g');
  return texto.replace(
    declareRe,
    (_, corpo, iface) => `declare module '${localizar(iface)}'${corpo}`,
  );
}

/** Insere `linha` a seguir à última linha de `ficheiro` que case com `grupo`. */
async function acrescentarDepoisDoUltimo(
  /** @type {string} */ ficheiro,
  /** @type {string} */ linha,
  /** @type {RegExp} */ grupo,
) {
  const texto = await readFile(ficheiro, 'utf-8');
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const linhas = texto.split(eol);
  if (linhas.includes(linha)) return;

  const ultima = linhas.findLastIndex((l) => grupo.test(l));
  if (ultima === -1) falhar(`${relative(raiz, ficheiro)}: não encontrei onde acrescentar ${linha}`);
  linhas.splice(ultima + 1, 0, linha);
  await writeFile(ficheiro, linhas.join(eol), 'utf-8');
}

/** Regista os metadados em EVO_BUILTIN_COMPONENT_META, para o Theme Studio. */
async function registarMetaDoComponente(/** @type {string} */ nome) {
  const ficheiro = join(toolkit, 'components', 'src', 'lib', 'provide-components.ts');
  const bruto = await readFile(ficheiro, 'utf-8');
  const eol = bruto.includes('\r\n') ? '\r\n' : '\n';
  // Trabalhar em LF: o `$` multilinha não casa antes de um `\r`.
  let texto = bruto.replaceAll('\r\n', '\n');
  const meta = `evo${classify(nome)}Meta`;
  const importLinha = `import { ${meta} } from './${nome}/${nome}.tokens';`;

  if (!texto.includes(importLinha)) {
    // Os imports dos metadados estão por ordem alfabética do caminho.
    const imports = [
      ...texto.matchAll(/^import \{ \w+ \} from '\.\/([\w-]+)\/[\w-]+\.tokens';$/gm),
    ];
    if (imports.length === 0) falhar('provide-components.ts sem imports de *.tokens reconhecíveis');
    const seguinte = imports.find((m) => m[1] > nome);
    const ultimo = imports[imports.length - 1];
    const pos = seguinte
      ? /** @type {number} */ (seguinte.index)
      : /** @type {number} */ (ultimo.index) + ultimo[0].length + 1;
    texto = texto.slice(0, pos) + importLinha + '\n' + texto.slice(pos);
  }

  if (!new RegExp(`^\\s+${meta},$`, 'm').test(texto)) {
    const fecho = texto.indexOf('] as const;');
    if (fecho === -1) falhar('EVO_BUILTIN_COMPONENT_META não encontrado em provide-components.ts');
    texto = texto.slice(0, fecho) + `  ${meta},\n` + texto.slice(fecho);
  }

  await writeFile(ficheiro, texto.replaceAll('\n', eol), 'utf-8');
  return [ficheiro];
}
