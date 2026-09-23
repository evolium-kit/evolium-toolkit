import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { TOOLKIT } from './constants';

interface OpcoesRotas {
  readonly authRoutes: boolean;
  readonly themeStudio: boolean;
}

/**
 * Acrescenta as rotas da toolkit ao `app.routes.ts`.
 *
 * O Theme Studio é registado por provider (`provideEvoThemeStudio`) e não aqui;
 * o que esta regra faz é o aviso de ordem, porque o provider tem de vir antes
 * do `provideRouter` para não ser sombreado por um `**`.
 */
export function addRoutes(sourceRoot: string, opcoes: OpcoesRotas): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!opcoes.authRoutes) return;

    const caminho = `${sourceRoot}/app/app.routes.ts`;
    const buffer = tree.read(caminho);

    if (!buffer) {
      context.logger.warn(`[evo] ${caminho} não encontrado; acrescenta as rotas à mão.`);
      return;
    }

    const conteudo = buffer.toString('utf-8');
    if (conteudo.includes('evoAuthRoutes')) return;

    const declaracao = /export const routes\s*:\s*Routes\s*=\s*\[/;
    if (!declaracao.test(conteudo)) {
      context.logger.warn(
        `[evo] não encontrei "export const routes: Routes = [" em ${caminho}. ` +
          `Acrescenta à mão:  ...evoAuthRoutes(),`,
      );
      return;
    }

    const comImport = acrescentarImport(
      conteudo,
      `import { evoAuthRoutes } from '${TOOLKIT}/pages';`,
    );

    tree.overwrite(
      caminho,
      comImport.replace(declaracao, (encontrado) => `${encontrado}\n  ...evoAuthRoutes(),\n`),
    );
  };
}

/** Insere um import a seguir ao último existente, ou no topo se não houver. */
function acrescentarImport(conteudo: string, linha: string): string {
  if (conteudo.includes(linha)) return conteudo;

  const ultimo = [...conteudo.matchAll(/^import\s[^;]+;$/gm)].pop();
  if (ultimo?.index === undefined) return `${linha}\n${conteudo}`;

  const fim = ultimo.index + ultimo[0].length;
  return `${conteudo.slice(0, fim)}\n${linha}${conteudo.slice(fim)}`;
}
