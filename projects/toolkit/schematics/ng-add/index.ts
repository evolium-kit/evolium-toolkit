import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  chain,
  noop,
} from '@angular-devkit/schematics';
import {
  ExistingBehavior,
  InstallBehavior,
  addDependency,
  addRootProvider,
  readWorkspace,
} from '@schematics/angular/utility';
import { PEER_DEPS, TOOLKIT } from '../utils/constants';
import { appendStyles, ensureLayerStatement } from '../utils/styles';
import { addRoutes } from '../utils/routes';
import { addThemeStudioProvider } from '../utils/theme-studio';

export interface NgAddOptions {
  project?: string;
  baseUrl: string;
  auth: boolean;
  authRoutes: boolean;
  themeStudio: boolean;
  skipInstall: boolean;
}

/**
 * Configura a toolkit numa aplicação existente.
 *
 * Tudo aqui é idempotente: correr `ng add` duas vezes não duplica providers,
 * estilos nem rotas. Um `ng add` que só funcione em projectos virgens é um
 * `ng add` que ninguém se atreve a correr outra vez.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    const nomeProjecto = options.project ?? [...workspace.projects.keys()][0];
    const projecto = nomeProjecto ? workspace.projects.get(nomeProjecto) : undefined;

    if (!projecto) {
      throw new SchematicsException(
        `Projecto "${nomeProjecto ?? '(nenhum)'}" não existe no angular.json.`,
      );
    }

    if (projecto.extensions['projectType'] !== 'application') {
      throw new SchematicsException(
        `"${nomeProjecto}" é uma library. A toolkit instala-se numa aplicação.`,
      );
    }

    const sourceRoot = projecto.sourceRoot ?? 'src';
    context.logger.info(`[evo] a configurar a toolkit em "${nomeProjecto}"…`);

    const instalar = options.skipInstall ? InstallBehavior.None : InstallBehavior.Auto;

    return chain([
      // 1. Peer dependencies.
      ...PEER_DEPS.map(([nome, versao]) =>
        addDependency(nome, versao, { install: instalar, existing: ExistingBehavior.Skip }),
      ),

      // 2. HttpClient com o dispatcher do kernel. Sem isto, nenhum interceptor
      //    de plugin corre e a autenticação falha em silêncio.
      temSimbolo(tree, sourceRoot, 'provideHttpClient')
        ? noop()
        : addRootProvider(
            nomeProjecto,
            ({ code, external }) =>
              code`${external('provideHttpClient', '@angular/common/http')}(${external('withFetch', '@angular/common/http')}(), ${external('withInterceptors', '@angular/common/http')}([${external('evoDispatchInterceptor', `${TOOLKIT}/services`)}]))`,
          ),

      // 3. Kernel de serviços.
      temSimbolo(tree, sourceRoot, 'provideEvoServices')
        ? noop()
        : addRootProvider(nomeProjecto, ({ code, external }) => {
            const features = [
              `${external('withBaseUrl', `${TOOLKIT}/services`)}('${options.baseUrl}')`,
            ];
            if (options.auth) {
              features.push(
                `${external('withPlugin', `${TOOLKIT}/services`)}(${external('authPlugin', `${TOOLKIT}/services`)}())`,
              );
            }
            return code`${external('provideEvoServices', `${TOOLKIT}/services`)}(${features.join(', ')})`;
          }),

      // 4. Tema.
      temSimbolo(tree, sourceRoot, 'provideEvoTheme')
        ? noop()
        : addRootProvider(
            nomeProjecto,
            ({ code, external }) =>
              code`${external('provideEvoTheme', `${TOOLKIT}/theme`)}(${external('withDarkMode', `${TOOLKIT}/theme`)}(), ${external('withPersistence', `${TOOLKIT}/theme`)}())`,
          ),

      // 5. Metadados dos componentes, para o Theme Studio não abrir vazio.
      options.themeStudio && !temSimbolo(tree, sourceRoot, 'provideEvoComponents')
        ? addRootProvider(
            nomeProjecto,
            ({ code, external }) =>
              code`${external('provideEvoComponents', `${TOOLKIT}/components`)}()`,
          )
        : noop(),

      // 5b. O provider do Theme Studio em si — distinto do passo 5, que só
      //     regista os metadados. Corrigido nesta versão: antes desta
      //     correcção, responder "sim" aqui não fazia NADA além de imprimir
      //     uma mensagem enganadora. Ver utils/theme-studio.ts.
      options.themeStudio ? addThemeStudioProvider(sourceRoot) : noop(),

      // 6. Folhas de estilo da toolkit.
      ensureLayerStatement(sourceRoot),
      appendStyles(sourceRoot),

      // 7. Rotas.
      addRoutes(sourceRoot, options),

      (_: Tree, ctx: SchematicContext) => {
        ctx.logger.info('');
        ctx.logger.info('[evo] pronto. A seguir:');
        ctx.logger.info('  ng g @evolium-kit/toolkit:page <nome>');
        ctx.logger.info('  ng g @evolium-kit/toolkit:resource-plugin <nome>');
        if (options.themeStudio) {
          ctx.logger.info(
            '  Theme Studio registado em /_evo/theme — só corre com "ng serve" (isDevMode()).',
          );
        }
        if (options.authRoutes) {
          ctx.logger.warn(
            '[evo] as páginas de /auth/* precisam de withComponentInputBinding() no provideRouter.',
          );
        }
      },
    ]);
  };
}

/** Procura um símbolo no `app.config.ts`, para não duplicar providers. */
function temSimbolo(tree: Tree, sourceRoot: string, simbolo: string): boolean {
  const conteudo = tree.read(`${sourceRoot}/app/app.config.ts`);
  return conteudo !== null && conteudo.toString('utf-8').includes(simbolo);
}
