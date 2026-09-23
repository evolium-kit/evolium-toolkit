// @ts-check
import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Verifica que `dist/toolkit` está completo e publicável.
 *
 * Existe porque quase todas as formas de partir o pacote são invisíveis no
 * build: um entry point que não entrou no `exports`, os assets dos schematics
 * que não foram copiados, o `package.json` com `type: module` a apanhar os
 * schematics CommonJS. Nada disto falha aqui — falha no projecto de quem
 * instalar, que é o pior sítio para descobrir.
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist', 'toolkit');

const ENTRY_POINTS = ['core', 'theme', 'components', 'layouts', 'pages', 'services'];
const ESTILOS = ['evolium-theme.css', 'evolium-components.css', 'evolium-layouts.css'];
const SCHEMATICS = [
  'collection.json',
  'migrations.json',
  'package.json',
  'ng-add/index.js',
  'ng-add/schema.json',
  'generators/page/index.js',
  'generators/layout/index.js',
  'generators/ui-component/index.js',
  'generators/resource-plugin/index.js',
];

/** @type {string[]} */
const problemas = [];

const existe = async (/** @type {string} */ caminho) => {
  try {
    await stat(join(dist, caminho));
    return true;
  } catch {
    return false;
  }
};

const exigir = async (/** @type {string} */ caminho, /** @type {string} */ porque) => {
  if (!(await existe(caminho))) problemas.push(`${caminho} em falta — ${porque}`);
};

// ---------------------------------------------------------------- package.json
const pkg = JSON.parse(await readFile(join(dist, 'package.json'), 'utf-8'));

if (pkg.name !== '@evolium-kit/toolkit') {
  problemas.push(`nome do pacote inesperado: ${pkg.name}`);
}

if (pkg.publishConfig?.registry !== 'https://npm.pkg.github.com') {
  problemas.push('publishConfig.registry não aponta para o GitHub Packages');
}

if (pkg.schematics !== './schematics/collection.json') {
  problemas.push('campo "schematics" em falta — o `ng add` não seria encontrado');
}

// ------------------------------------------------------------- entry points
for (const ep of ENTRY_POINTS) {
  await exigir(`${ep}/package.json`, 'entry point não foi construído');

  if (!pkg.exports?.[`./${ep}`]) {
    problemas.push(`exports["./${ep}"] em falta — o import falharia no consumidor`);
  }
}

// ------------------------------------------------------------------ estilos
for (const estilo of ESTILOS) {
  await exigir(`styles/${estilo}`, 'folha de estilos não foi copiada');
}

/*
 * Sem esta entrada, `@import '@evolium-kit/toolkit/styles/…'` falha no
 * consumidor com "path is not exported" — mesmo com os ficheiros presentes.
 * No workspace de desenvolvimento não se nota, porque o playground importa
 * por caminho relativo ao dist e não passa pelo `exports`.
 */
if (!pkg.exports?.['./styles/*']) {
  problemas.push('exports["./styles/*"] em falta — as folhas não seriam importáveis');
}

/*
 * O ng-packagr escreve um .npmignore com `**​/package.json`, o que apagaria o
 * package.json dos schematics do tarball e faria o `ng add` voltar a ser
 * tratado como ESM. A excepção é acrescentada no build.
 */
const npmignore = await readFile(join(dist, '.npmignore'), 'utf-8').catch(() => '');
if (!npmignore.includes('!schematics/package.json')) {
  problemas.push(
    '.npmignore sem a excepção "!schematics/package.json" — o `ng add` falharia no pacote instalado',
  );
}

// --------------------------------------------------------------- schematics
for (const ficheiro of SCHEMATICS) {
  await exigir(`schematics/${ficheiro}`, 'asset de schematics não foi copiado');
}

/*
 * O ng-packagr marca o pacote como ESM. Os schematics são CommonJS, por isso
 * precisam de um package.json local a dizê-lo — sem ele, o `ng add` morre com
 * "exports is not defined in ES module scope".
 */
if (await existe('schematics/package.json')) {
  const schematicsPkg = JSON.parse(
    await readFile(join(dist, 'schematics', 'package.json'), 'utf-8'),
  );
  if (schematicsPkg.type !== 'commonjs') {
    problemas.push('schematics/package.json não declara type: commonjs — o `ng add` falharia');
  }
}

// --------------------------------------------------------------------- saída
if (problemas.length > 0) {
  console.error('[evo] o artefacto está incompleto:\n');
  for (const problema of problemas) console.error(`  ✗ ${problema}`);
  console.error('');
  process.exit(1);
}

console.log(
  `[evo] artefacto verificado: ${ENTRY_POINTS.length} entry points, ` +
    `${ESTILOS.length} folhas de estilo, ${SCHEMATICS.length} ficheiros de schematics.`,
);
