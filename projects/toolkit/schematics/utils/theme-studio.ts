import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { TOOLKIT } from './constants';

/**
 * Regista o Theme Studio em `app.config.ts`.
 *
 * **Bug histórico (corrigido nesta versão):** até à 0.1.0, esta função não
 * existia — o `ng-add` perguntava "Registar o Theme Studio?" e, mesmo com a
 * resposta "sim", não acrescentava `provideEvoThemeStudio()` a lado nenhum.
 * A mensagem final da consola dizia "Theme Studio em /_evo/theme", dando a
 * entender (por engano) que já estava configurado. Resultado: `/_evo/theme`
 * dava sempre 404. Ver `.claude/KNOWN-BUGS.md`.
 *
 * Usa `addRootProvider` do `@schematics/angular/utility` de propósito **não**
 * — essa utilidade só sabe acrescentar ao FIM do array `providers`, e o
 * `provideEvoThemeStudio()` tem de vir **antes** do `provideRouter()`, senão
 * uma rota `**` do projecto sombreia `/_evo/theme`. Por isso esta função
 * insere directamente a seguir a `providers: [`, com edição de texto — o
 * mesmo padrão já usado em `addRoutes()` para `app.routes.ts`.
 */
export function addThemeStudioProvider(sourceRoot: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const caminho = `${sourceRoot}/app/app.config.ts`;
    const buffer = tree.read(caminho);

    if (!buffer) {
      context.logger.warn(
        `[evo] ${caminho} não encontrado; regista o Theme Studio à mão — ver theme/README.md.`,
      );
      return;
    }

    let conteudo = buffer.toString('utf-8');
    if (conteudo.includes('provideEvoThemeStudio')) return; // idempotente

    const declaracao = /providers\s*:\s*\[/;
    if (!declaracao.test(conteudo)) {
      context.logger.warn(
        `[evo] não encontrei "providers: [" em ${caminho}. Regista o Theme Studio à mão.`,
      );
      return;
    }

    conteudo = acrescentarImport(
      conteudo,
      `import { provideEvoThemeStudio } from '${TOOLKIT}/pages';`,
    );
    conteudo = garantirIsDevMode(conteudo);

    // Primeira entrada do array — é isto que garante que vem antes de
    // qualquer provideRouter(), independentemente da ordem dos outros passos
    // do ng-add no chain().
    conteudo = conteudo.replace(
      declaracao,
      (encontrado) => `${encontrado}\n    ...(isDevMode() ? [provideEvoThemeStudio()] : []),`,
    );

    tree.overwrite(caminho, conteudo);
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

/**
 * `isDevMode()` é indispensável aqui — sem ele o Theme Studio ficaria
 * registado também em produção. Junta-o à import existente de
 * `@angular/core` em vez de criar uma linha nova.
 */
function garantirIsDevMode(conteudo: string): string {
  const importCore = /import\s*\{([^}]*)\}\s*from\s*'@angular\/core';/;
  const match = conteudo.match(importCore);

  if (!match) {
    // Nenhum import de @angular/core ainda — improvável num app.config.ts
    // válido, mas cobrir na mesma em vez de partir silenciosamente.
    return `import { isDevMode } from '@angular/core';\n${conteudo}`;
  }

  const nomes = match[1];
  if (nomes.includes('isDevMode')) return conteudo;

  const nomesActualizados = nomes
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .concat('isDevMode')
    .sort()
    .join(', ');

  return conteudo.replace(importCore, `import { ${nomesActualizados} } from '@angular/core';`);
}
