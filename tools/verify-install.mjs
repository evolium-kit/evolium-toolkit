// @ts-check
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Empacota a toolkit e instala-a num workspace Angular virgem.
 *
 * É o único teste que exercita o pacote como um consumidor o vive: o tarball a
 * sério, a resolução dos entry points por `exports`, o `ng add` a correr dentro
 * do CLI. Tudo o resto usa os ficheiros do `dist` directamente e não veria, por
 * exemplo, um ficheiro excluído do `files` do npm.
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist', 'toolkit');

/** @param {string} comando @param {string[]} args @param {string} cwd */
function correr(comando, args, cwd) {
  return execFileSync(comando, args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    timeout: 10 * 60 * 1000,
  });
}

const temporario = await mkdtemp(join(tmpdir(), 'evo-install-'));
let codigo = 0;

try {
  console.log('[evo] a empacotar…');
  correr('npm', ['pack', '--pack-destination', temporario], dist);

  const tarball = (await readdir(temporario)).find((f) => f.endsWith('.tgz'));
  if (!tarball) throw new Error('npm pack não produziu nenhum tarball.');
  console.log(`[evo] tarball: ${tarball}`);

  console.log('[evo] a criar um workspace Angular virgem…');
  correr(
    'npx',
    [
      '--yes',
      '@angular/cli@21',
      'new',
      'consumidor',
      '--skip-git',
      '--skip-install',
      '--style=css',
      '--ssr=false',
      '--defaults',
    ],
    temporario,
  );

  const consumidor = join(temporario, 'consumidor');

  console.log('[evo] a instalar…');
  correr('npm', ['install', '--no-audit', '--no-fund'], consumidor);
  correr('npm', ['install', join(temporario, tarball), '--no-audit', '--no-fund'], consumidor);

  console.log('[evo] a correr ng add…');
  correr(
    'npx',
    ['ng', 'add', '@evolium-kit/toolkit', '--skip-confirmation', '--defaults'],
    consumidor,
  );

  // O `ng add` fez mesmo o que promete?
  const config = await readFile(join(consumidor, 'src/app/app.config.ts'), 'utf-8');
  const estilos = await readFile(join(consumidor, 'src/styles.css'), 'utf-8');

  /** @type {[string, boolean][]} */
  const verificacoes = [
    ['provideEvoServices no app.config', config.includes('provideEvoServices')],
    ['provideEvoTheme no app.config', config.includes('provideEvoTheme')],
    ['evoDispatchInterceptor no app.config', config.includes('evoDispatchInterceptor')],
    ['declaração de camadas no styles.css', estilos.includes('evo.overrides')],
    ['folha de tema importada', estilos.includes('evolium-theme.css')],
  ];

  const falhadas = verificacoes.filter(([, ok]) => !ok).map(([nome]) => nome);
  if (falhadas.length > 0) {
    throw new Error(`o \`ng add\` não configurou: ${falhadas.join(', ')}`);
  }

  // Um componente da toolkit num ficheiro do consumidor, para forçar a
  // resolução real dos entry points no build.
  await writeFile(
    join(consumidor, 'src/app/app.ts'),
    `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EvoButton, EvoCard } from '@evolium-kit/toolkit/components';
import { EvoAuthShell } from '@evolium-kit/toolkit/layouts';

@Component({
  selector: 'app-root',
  imports: [EvoButton, EvoCard, EvoAuthShell],
  template: \`
    <evo-auth-shell>
      <h1 slot="title">Instalação verificada</h1>
      <evo-card><button evoButton>Funciona</button></evo-card>
    </evo-auth-shell>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
`,
    'utf-8',
  );

  console.log('[evo] a construir o consumidor…');
  correr('npx', ['ng', 'build'], consumidor);

  console.log('\n[evo] instalação limpa verificada: pack, ng add e build.');
} catch (erro) {
  codigo = 1;
  console.error('\n[evo] a instalação limpa falhou:\n');
  const e = /** @type {{ stdout?: string; stderr?: string; message?: string }} */ (erro);
  console.error(e.stdout ?? '');
  console.error(e.stderr ?? e.message ?? String(erro));
} finally {
  await rm(temporario, { recursive: true, force: true });
}

process.exit(codigo);
