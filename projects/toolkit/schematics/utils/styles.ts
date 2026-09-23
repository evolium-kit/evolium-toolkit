import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LAYER_STATEMENT, STYLE_IMPORTS } from './constants';

const FICHEIRO = (sourceRoot: string): string => `${sourceRoot}/styles.css`;

/**
 * Garante que a declaração `@layer` é a primeira regra do `styles.css`.
 *
 * É o requisito menos óbvio de toda a integração, e o único cuja ausência dá um
 * sintoma confuso: as utilities do Tailwind deixam de ganhar às regras da
 * toolkit, sem erro nenhum.
 */
export function ensureLayerStatement(sourceRoot: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const caminho = FICHEIRO(sourceRoot);
    const buffer = tree.read(caminho);

    if (!buffer) {
      context.logger.warn(`[evo] ${caminho} não encontrado; acrescenta os estilos à mão.`);
      return;
    }

    const conteudo = buffer.toString('utf-8');
    if (conteudo.includes('evo.overrides')) return; // já lá está

    tree.overwrite(caminho, `${LAYER_STATEMENT}\n\n${conteudo}`);
  };
}

/** Acrescenta os `@import` da toolkit, sem duplicar os que já existam. */
export function appendStyles(sourceRoot: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const caminho = FICHEIRO(sourceRoot);
    const buffer = tree.read(caminho);

    if (!buffer) {
      context.logger.warn(
        `[evo] ${caminho} não encontrado. Importa à mão:\n` +
          STYLE_IMPORTS.map((i) => `  @import '${i}';`).join('\n'),
      );
      return;
    }

    const conteudo = buffer.toString('utf-8');
    const emFalta = STYLE_IMPORTS.filter((imp) => !conteudo.includes(imp));
    if (emFalta.length === 0) return;

    const bloco = emFalta.map((imp) => `@import '${imp}';`).join('\n');

    // Os imports da toolkit vão a seguir ao último @import existente — o
    // Tailwind tem de vir antes, para a ponte @theme inline poder referi-los.
    const ultimoImport = [...conteudo.matchAll(/^@import\s[^;]+;/gm)].pop();

    if (ultimoImport?.index === undefined) {
      tree.overwrite(caminho, `${conteudo.trimEnd()}\n\n${bloco}\n`);
      return;
    }

    const fim = ultimoImport.index + ultimoImport[0].length;
    tree.overwrite(caminho, `${conteudo.slice(0, fim)}\n${bloco}${conteudo.slice(fim)}`);
  };
}
