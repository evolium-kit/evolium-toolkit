import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import {
  BLOCO_CLAUDE_MD,
  CAMINHO_SKILL,
  FIM_BLOCO,
  MARCA_GERADO,
  PREFIXO_INICIO,
  SKILL,
} from './conteudo';

/**
 * Dá ao Claude Code do projecto consumidor a visão da toolkit instalada.
 *
 * Escreve, na raiz do workspace:
 * - `.claude/skills/evolium-toolkit/SKILL.md` — skill que o Claude carrega
 *   quando a tarefa envolve a toolkit, e que o manda ler o índice
 *   `node_modules/@evolium-kit/toolkit/AGENTS.md`;
 * - um bloco entre marcadores no `CLAUDE.md` (ou `.claude/CLAUDE.md`, se for
 *   esse o que existe), criado se não houver nenhum.
 *
 * Idempotente: correr de novo actualiza a skill (se ainda tiver a marca de
 * gerado) e o bloco, sem duplicar nem tocar no resto do `CLAUDE.md`. Ver
 * docs/ai-context.md no repositório da toolkit.
 */
export function aiContext(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    escreverSkill(tree, context);
    escreverBlocoClaudeMd(tree, context);
    context.logger.info(
      '[evo] Claude Code: skill "evolium-toolkit" e bloco no CLAUDE.md prontos. ' +
        'O índice é node_modules/@evolium-kit/toolkit/AGENTS.md.',
    );
  };
}

function escreverSkill(tree: Tree, context: SchematicContext): void {
  const actual = tree.read(CAMINHO_SKILL)?.toString('utf-8');
  if (actual === undefined) {
    tree.create(CAMINHO_SKILL, SKILL);
    return;
  }
  if (!actual.includes(MARCA_GERADO)) {
    // O utilizador personalizou a skill (apagou a marca): não se reescreve.
    context.logger.warn(
      `[evo] ${CAMINHO_SKILL} foi personalizado (sem a marca de gerado); não foi alterado.`,
    );
    return;
  }
  if (actual !== SKILL) tree.overwrite(CAMINHO_SKILL, SKILL);
}

function escreverBlocoClaudeMd(tree: Tree, context: SchematicContext): void {
  // O Claude Code lê ambos; usa-se o que o projecto já tiver.
  const caminho =
    !tree.exists('CLAUDE.md') && tree.exists('.claude/CLAUDE.md')
      ? '.claude/CLAUDE.md'
      : 'CLAUDE.md';
  const actual = tree.read(caminho)?.toString('utf-8');

  if (actual === undefined) {
    tree.create(caminho, `# Instruções para agentes de IA\n\n${BLOCO_CLAUDE_MD}\n`);
    return;
  }

  // Só o prefixo do marcador: o texto depois dele pode mudar entre versões, e
  // um bloco antigo tem de ser reconhecido na mesma.
  const inicio = actual.indexOf(PREFIXO_INICIO);
  const fim = actual.indexOf(FIM_BLOCO);
  let novo: string;
  if (inicio !== -1 && fim > inicio) {
    novo = actual.slice(0, inicio) + BLOCO_CLAUDE_MD + actual.slice(fim + FIM_BLOCO.length);
  } else {
    if (inicio !== -1 || fim !== -1) {
      context.logger.warn(
        `[evo] ${caminho}: marcadores da toolkit incompletos; bloco acrescentado no fim.`,
      );
    }
    novo = `${actual.trimEnd()}\n\n${BLOCO_CLAUDE_MD}\n`;
  }
  if (novo !== actual) tree.overwrite(caminho, novo);
}
