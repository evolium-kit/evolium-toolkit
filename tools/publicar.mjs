// @ts-check
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import {
  NAO_PUBLICADO,
  PIPELINE,
  compararVersoes,
  hoje,
  normalizarVersao,
  notasNaoPublicadas,
  prepararChangelog,
  trocarVersaoPackageJson,
} from './publicar-lib.mjs';

/**
 * Prepara e envia uma versão nova da toolkit.
 *
 * Uso:
 *   npm run publicar -- --version v0.2.2 [--dry-run] [--yes]
 *
 * O `--` é obrigatório: sem ele o npm toma `--version` para si e só mostra a
 * versão do próprio npm.
 *
 * Passos (pára no primeiro erro):
 *   A. validações — versão vX.Y.Z maior que a actual, tag livre (local e
 *      origin), ramo main, working tree limpa, não atrás do origin/main,
 *      secção "[Não publicado]" do CHANGELOG com conteúdo;
 *   —  resumo (versão anterior → nova, notas) e confirmação, salvo --yes;
 *      só a partir daqui se altera algum ficheiro;
 *   B. versão em projects/toolkit/package.json e secção nova no CHANGELOG;
 *   C. a mesma pipeline do .github/workflows/release.yml, já com a versão
 *      nova (o verify-install empacota o tarball que vai ser publicado), e
 *      confirmação de que dist/toolkit/package.json tem a versão da tag;
 *   D. commit "chore(release): X.Y.Z", tag vX.Y.Z e `git push --atomic`;
 *   E. se houver `gh`, acompanha o workflow de release até ao fim.
 *
 * Nunca corre `npm publish`: quem publica é o GitHub Actions, por causa da
 * tag (regra inviolável 7). Se algo falhar antes do push, os ficheiros
 * voltam ao que eram; se o push falhar, o commit e a tag locais são desfeitos.
 */

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(raiz, 'projects', 'toolkit', 'package.json');
const PKG_DIST = join(raiz, 'dist', 'toolkit', 'package.json');
const CHANGELOG = join(raiz, 'CHANGELOG.md');
const RAMO = 'main';

const USO = `Uso: npm run publicar -- --version vX.Y.Z [--dry-run] [--yes]

  --version vX.Y.Z  versão nova (também aceite como primeiro argumento)
  --dry-run         valida, actualiza os ficheiros e corre a pipeline; no fim
                    mostra o diff e repõe tudo. Sem commit, tag nem push.
  --yes             não pede confirmação (a versão anterior e a nova são
                    mostradas na mesma)
  --help            esta ajuda

Não esquecer o "--" depois de "npm run publicar".`;

// ------------------------------------------------------------------ utilitários

const cor = (/** @type {number} */ c) => (/** @type {string} */ t) =>
  process.stdout.isTTY ? `\x1b[${c}m${t}\x1b[0m` : t;
const negrito = cor(1);
const verde = cor(32);
const vermelho = cor(31);
const amarelo = cor(33);

class Falha extends Error {}

/**
 * @param {string} msg
 * @returns {never}
 */
function falhar(msg) {
  throw new Falha(msg);
}

/**
 * Corre um comando. No Windows, `npm` é um `.cmd` e só arranca por shell; os
 * argumentos passados assim são simples (nomes de scripts), sem espaços.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ capturar?: boolean, permitirFalha?: boolean }} [opcoes]
 */
function correr(cmd, args, { capturar = false, permitirFalha = false } = {}) {
  const r = spawnSync(cmd, args, {
    cwd: raiz,
    // stdin nunca é do filho: nenhum passo da pipeline pode ficar à espera de
    // teclas (modo watch, prompts). A única pergunta é a do próprio script.
    stdio: capturar ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
    encoding: 'utf8',
    shell: process.platform === 'win32' && cmd === 'npm',
  });
  if (r.error) falhar(`não foi possível correr "${cmd}": ${r.error.message}`);
  if (r.status !== 0 && !permitirFalha) {
    const detalhe = capturar ? `\n${(r.stderr || r.stdout || '').trim()}` : '';
    falhar(`"${[cmd, ...args].join(' ')}" terminou com código ${r.status}.${detalhe}`);
  }
  return { ok: r.status === 0, saida: (r.stdout ?? '').trim() };
}

const git = (/** @type {string[]} */ ...args) => correr('git', args, { capturar: true }).saida;
const headActual = () => git('rev-parse', 'HEAD');

/** @param {string} titulo */
function passo(titulo) {
  console.log(`\n${negrito(`▶ ${titulo}`)}`);
}

/** @param {string} pergunta */
async function confirmar(pergunta) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const resposta = await rl.question(`${pergunta} [s/N] `);
    return /^s(im)?$/i.test(resposta.trim());
  } finally {
    rl.close();
  }
}

// --------------------------------------------------------------------- argumentos

/** @param {string[]} argv */
function lerArgumentos(argv) {
  const opcoes = {
    versao: /** @type {string | undefined} */ (undefined),
    dryRun: false,
    sim: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(USO);
      process.exit(0);
    } else if (a === '--dry-run') opcoes.dryRun = true;
    else if (a === '--yes' || a === '-y') opcoes.sim = true;
    else if (a === '--version') opcoes.versao = argv[++i];
    else if (a.startsWith('--version=')) opcoes.versao = a.slice('--version='.length);
    else if (!a.startsWith('-') && !opcoes.versao) opcoes.versao = a;
    else falhar(`argumento desconhecido: ${a}\n\n${USO}`);
  }
  if (!opcoes.versao) falhar(`falta a versão.\n\n${USO}`);
  try {
    return { ...opcoes, versao: normalizarVersao(opcoes.versao) };
  } catch (e) {
    return falhar(/** @type {Error} */ (e).message);
  }
}

// ------------------------------------------------------------------------ passos

/**
 * A. Tudo o que se verifica sem alterar nada. Devolve o CHANGELOG já
 * transformado (falha aqui se a secção "[Não publicado]" estiver vazia).
 *
 * @param {string} versao
 */
function validar(versao) {
  passo('A. Validações');
  const tag = `v${versao}`;

  const actual = JSON.parse(readFileSync(PKG, 'utf8')).version;
  if (compararVersoes(versao, actual) <= 0) {
    falhar(`a versão ${versao} não é maior do que a actual (${actual}).`);
  }
  console.log(`  versão: ${actual} → ${verde(versao)}`);

  const ramo = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (ramo !== RAMO) falhar(`estás no ramo "${ramo}"; publica-se a partir de "${RAMO}".`);

  const sujos = git('status', '--porcelain');
  if (sujos) {
    falhar(`há alterações por commitar. Fazer commit ou stash primeiro:\n${sujos}`);
  }

  console.log('  a actualizar o origin…');
  git('fetch', '--quiet', '--tags', 'origin', RAMO);
  const atras = Number(git('rev-list', '--count', `HEAD..origin/${RAMO}`));
  if (atras > 0) {
    falhar(`o ${RAMO} está ${atras} commit(s) atrás do origin/${RAMO}. Fazer "git pull" primeiro.`);
  }

  if (
    correr('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], {
      capturar: true,
      permitirFalha: true,
    }).ok
  ) {
    falhar(`a tag ${tag} já existe localmente.`);
  }
  if (git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`)) {
    falhar(`a tag ${tag} já existe no origin.`);
  }

  const textoChangelog = readFileSync(CHANGELOG, 'utf8');
  let notas, changelog;
  try {
    notas = notasNaoPublicadas(textoChangelog);
    changelog = prepararChangelog(textoChangelog, versao, hoje());
  } catch (e) {
    // Erros de validação da lib, não bugs: mensagem limpa, sem stack trace.
    falhar(e instanceof Error ? e.message : String(e));
  }
  console.log(`  ramo ${RAMO}, working tree limpa, tag ${tag} livre, CHANGELOG com conteúdo.`);
  return { changelog, actual, notas };
}

/**
 * Mostra o que vai acontecer — versão anterior e nova, e as notas — antes de
 * mexer em qualquer ficheiro. Sem `--yes`, só continua com confirmação.
 *
 * @param {{ versao: string, actual: string, notas: string, dryRun: boolean, sim: boolean }} r
 */
async function resumirEConfirmar({ versao, actual, notas, dryRun, sim }) {
  passo('Resumo');
  console.log(`  Versão anterior: ${negrito(actual)}`);
  console.log(`  Versão nova:     ${negrito(verde(versao))}   (tag v${versao})`);
  console.log(`\n  CHANGELOG — ## [${versao}] - ${hoje()}`);
  console.log(notas.replace(/^/gm, '  │ '));
  console.log(
    dryRun
      ? '\n  Dry-run: corre a pipeline e repõe tudo no fim. Nada é enviado.'
      : `\n  A seguir: pipeline completa (alguns minutos), commit "chore(release): ${versao}",\n` +
          `  tag v${versao} e push para o origin. O GitHub Actions publica depois.`,
  );

  if (dryRun || sim) return;
  if (!process.stdin.isTTY) falhar('sem terminal interactivo para confirmar: usar --yes.');
  if (!(await confirmar(`\nPublicar ${actual} → ${versao}?`))) {
    falhar('cancelado. Nada foi alterado.');
  }
}

/**
 * Guarda o conteúdo original para repor em caso de falha (também com Ctrl+C).
 *
 * @param {string[]} ficheiros
 */
function guardarOriginais(ficheiros) {
  const originais = new Map(ficheiros.map((f) => [f, readFileSync(f, 'utf8')]));
  const head = headActual();
  let reposto = false;
  const semEol = (/** @type {string} */ t) => t.replace(/\r\n/g, '\n');
  const repor = () => {
    if (reposto) return;
    reposto = true;
    // Se alguém fez commit enquanto o script corria, os ficheiros já não são
    // só nossos: repô-los desfaria esse commit no working tree, em silêncio.
    if (headActual() !== head) {
      console.error(
        amarelo(
          '\nO HEAD mudou durante a publicação (houve um commit entretanto): ' +
            'package.json e CHANGELOG.md NÃO foram repostos. Confirmar com "git status" e "git log".',
        ),
      );
      return;
    }
    for (const [f, texto] of originais) {
      // Depois de um `git reset` o ficheiro já está certo, mas com o fim de
      // linha do checkout (autocrlf); reescrevê-lo deixaria um "M" fantasma.
      if (semEol(readFileSync(f, 'utf8')) !== semEol(texto)) writeFileSync(f, texto);
    }
  };
  const aoInterromper = () => {
    console.error(vermelho('\nInterrompido. Nada foi enviado.'));
    repor();
    process.exit(130);
  };
  process.once('SIGINT', aoInterromper);
  return {
    repor,
    /** Antes de fazer commit: o repositório continua como o deixámos? */
    confirmarIntacto: () => {
      if (headActual() !== head) {
        falhar(
          'o HEAD mudou durante a publicação (houve um commit entretanto). ' +
            'Nada foi enviado. Ver docs/contributing.md, "Se a publicação parar a meio".',
        );
      }
      const alheios = git('status', '--porcelain')
        .split('\n')
        .filter(Boolean)
        .filter((l) => !/ (projects\/toolkit\/package\.json|CHANGELOG\.md)$/.test(l));
      if (alheios.length) {
        falhar(`apareceram outras alterações durante a publicação:\n${alheios.join('\n')}`);
      }
    },
    /** Depois do commit, já não há nada a repor. */
    largar: () => process.off('SIGINT', aoInterromper),
  };
}

/**
 * B. Escreve a versão e o CHANGELOG.
 *
 * @param {string} versao
 * @param {string} changelog
 */
function prepararFicheiros(versao, changelog) {
  passo('B. Versão e CHANGELOG');
  writeFileSync(PKG, trocarVersaoPackageJson(readFileSync(PKG, 'utf8'), versao));
  writeFileSync(CHANGELOG, changelog);
  console.log(`  projects/toolkit/package.json → ${versao}`);
  console.log(`  CHANGELOG.md: "${NAO_PUBLICADO}" → "## [${versao}] - ${hoje()}"`);
}

/** @param {string} versao */
function correrPipeline(versao) {
  passo('C. Pipeline (a mesma do release.yml)');
  for (const [cmd, args] of PIPELINE) {
    const nome = [cmd, ...args].join(' ');
    console.log(`\n${amarelo(`$ ${nome}`)}`);
    const inicio = Date.now();
    correr(cmd, /** @type {string[]} */ (args));
    console.log(verde(`✔ ${nome} (${Math.round((Date.now() - inicio) / 1000)}s)`));
  }
  const noDist = JSON.parse(readFileSync(PKG_DIST, 'utf8')).version;
  if (noDist !== versao) {
    falhar(`dist/toolkit/package.json tem a versão ${noDist}, e não ${versao}.`);
  }
  console.log(verde(`✔ dist/toolkit/package.json tem a versão ${versao}`));
}

/** @param {string} versao */
function enviar(versao) {
  passo('D. Commit, tag e push');
  const tag = `v${versao}`;
  git('add', 'projects/toolkit/package.json', 'CHANGELOG.md');
  git('commit', '--quiet', '-m', `chore(release): ${versao}`);
  git('tag', tag);
  console.log(`  commit "chore(release): ${versao}" e tag ${tag} criados.`);

  const push = correr('git', ['push', '--atomic', 'origin', RAMO, tag], { permitirFalha: true });
  if (!push.ok) {
    // Desfaz só o que este script criou; a working tree estava limpa no início.
    git('tag', '-d', tag);
    git('reset', '--keep', 'HEAD~1');
    falhar('o push falhou; o commit e a tag locais foram desfeitos. Nada foi enviado.');
  }
  console.log(verde(`✔ ${RAMO} e ${tag} enviados para o origin.`));
}

/** @param {string} versao */
async function acompanhar(versao) {
  passo('E. Workflow de release');
  const tag = `v${versao}`;
  if (!correr('gh', ['--version'], { capturar: true, permitirFalha: true }).ok) {
    console.log(
      '  "gh" não está instalado: acompanha em https://github.com/evolium-kit/evolium-toolkit/actions',
    );
    return;
  }
  // O run demora uns segundos a aparecer depois do push da tag.
  let id = '';
  for (let i = 0; i < 12 && !id; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    id = correr(
      'gh',
      [
        'run',
        'list',
        '--workflow',
        'release.yml',
        '--branch',
        tag,
        '--limit',
        '1',
        '--json',
        'databaseId',
        '-q',
        '.[0].databaseId',
      ],
      { capturar: true, permitirFalha: true },
    ).saida;
  }
  if (!id) {
    console.log(
      amarelo(
        '  o workflow ainda não apareceu; confirma com "gh run list --workflow release.yml".',
      ),
    );
    return;
  }
  const r = correr('gh', ['run', 'watch', id, '--exit-status'], { permitirFalha: true });
  if (!r.ok) {
    falhar(
      `o workflow de release falhou (run ${id}). A tag já está no origin, mas nada foi publicado: ` +
        `ver "gh run view ${id} --log-failed".`,
    );
  }
  console.log(verde(`✔ @evolium-kit/toolkit@${versao} publicado no GitHub Packages.`));
  console.log(`\nNo projecto consumidor: npm install @evolium-kit/toolkit@${versao}`);
}

// -------------------------------------------------------------------------- main

async function main() {
  const { versao, dryRun, sim } = lerArgumentos(process.argv.slice(2));
  console.log(negrito(`Publicar @evolium-kit/toolkit ${versao}${dryRun ? ' (dry-run)' : ''}`));

  const { changelog, actual, notas } = validar(versao);
  await resumirEConfirmar({ versao, actual, notas, dryRun, sim });
  const ficheiros = guardarOriginais([PKG, CHANGELOG]);

  try {
    prepararFicheiros(versao, changelog);
    correrPipeline(versao);

    if (dryRun) {
      passo('Dry-run: o que seria enviado');
      correr('git', ['--no-pager', 'diff', '--stat']);
      console.log(
        `\n  commit "chore(release): ${versao}", tag v${versao}, push --atomic origin ${RAMO} v${versao}`,
      );
      ficheiros.repor();
      console.log(verde('\n✔ Dry-run terminado: ficheiros repostos, nada enviado.'));
      return;
    }

    ficheiros.confirmarIntacto();
    enviar(versao);
    ficheiros.largar();
  } catch (e) {
    ficheiros.repor();
    throw e;
  }

  await acompanhar(versao);
}

main().catch((e) => {
  if (e instanceof Falha) {
    console.error(`\n${vermelho('✖')} ${e.message}`);
    process.exit(1);
  }
  throw e;
});
