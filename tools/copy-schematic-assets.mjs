// @ts-check
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Copia para o `dist` tudo o que o `tsc` não compila.
 *
 * O `tsconfig.schematics.json` exclui `files/**` de propósito: são templates
 * com sintaxe EJS que não são TypeScript válido. Mas o Angular CLI precisa
 * deles em runtime, tal como precisa do `collection.json` e dos `schema.json`.
 * Sem este passo, `ng add` falha com "Collection não encontrada".
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origem = join(raiz, 'projects', 'toolkit', 'schematics');
const destino = join(raiz, 'dist', 'toolkit', 'schematics');

/** Percorre a árvore e devolve os caminhos relativos a copiar. */
async function recolher(dir, base = dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  const encontrados = [];

  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);

    if (entrada.isDirectory()) {
      encontrados.push(...(await recolher(caminho, base)));
      continue;
    }

    const relativo = relative(base, caminho);
    const copiar =
      entrada.name === 'collection.json' ||
      entrada.name === 'migrations.json' ||
      entrada.name.endsWith('schema.json') ||
      relativo.split(/[\\/]/).includes('files');

    if (copiar) encontrados.push(relativo);
  }

  return encontrados;
}

const ficheiros = await recolher(origem);

if (ficheiros.length === 0) {
  console.error('[evo] nenhum asset de schematics encontrado. O build está incompleto.');
  process.exit(1);
}

for (const relativo of ficheiros) {
  const de = join(origem, relativo);
  const para = join(destino, relativo);
  await mkdir(dirname(para), { recursive: true });
  await cp(de, para);
}

/*
 * O `package.json` do pacote, gerado pelo ng-packagr, declara `type: module`.
 * Sem este ficheiro, o Node trataria os `.js` dos schematics — que são
 * CommonJS — como ESM, e o `ng add` falhava com "exports is not defined in ES
 * module scope". Um `package.json` local sobrepõe o `type` do pacote pai para
 * esta pasta e só para ela.
 */
await writeFile(
  join(destino, 'package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
  'utf-8',
);

/*
 * …e o ng-packagr gera um `.npmignore` com `**​/package.json`, partindo do
 * princípio de que os package.json aninhados só servem em desenvolvimento.
 * Para os entry points é verdade — o que os publica é o campo `exports`. Para
 * os schematics não é: sem o ficheiro, o pacote instalado volta a tratá-los
 * como ESM e o `ng add` morre. A negação tem de vir depois da regra.
 */
const npmignore = join(raiz, 'dist', 'toolkit', '.npmignore');
const excepcao = '!schematics/package.json';
const actual = await readFile(npmignore, 'utf-8').catch(() => '');

if (!actual.includes(excepcao)) {
  await writeFile(npmignore, `${actual.trimEnd()}\n${excepcao}\n`, 'utf-8');
}

// Falhar aqui é melhor do que publicar um pacote cujo `ng add` não arranca.
await stat(join(destino, 'collection.json'));

console.log(
  `[evo] ${ficheiros.length} assets de schematics copiados para dist/toolkit/schematics ` +
    `(+ package.json com type: commonjs).`,
);
