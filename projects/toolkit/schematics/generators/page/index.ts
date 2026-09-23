import { strings } from '@angular-devkit/core';
import {
  MergeStrategy,
  Rule,
  SchematicsException,
  Tree,
  apply,
  applyTemplates,
  filter,
  mergeWith,
  move,
  noop,
  url,
} from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';
import { TOOLKIT } from '../../utils/constants';

export interface PageOptions {
  name: string;
  project?: string;
  path?: string;
  layout: 'blank' | 'dashboard' | 'auth';
  resource?: string;
  skipTests: boolean;
}

const SHELL: Record<PageOptions['layout'], { classe: string; selector: string }> = {
  blank: { classe: 'EvoBlankShell', selector: 'evo-blank-shell' },
  dashboard: { classe: 'EvoDashboardShell', selector: 'evo-dashboard-shell' },
  auth: { classe: 'EvoAuthShell', selector: 'evo-auth-shell' },
};

/**
 * Gera uma página com os quatro estados obrigatórios já escritos.
 *
 * O esqueleto inclui loading, vazio, erro e pronto de propósito: apagar o que
 * não se usa é trivial, lembrar-se de acrescentar o estado de erro não é.
 */
export function page(options: PageOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await readWorkspace(tree);
    const nomeProjecto = options.project ?? [...workspace.projects.keys()][0];
    const projecto = nomeProjecto ? workspace.projects.get(nomeProjecto) : undefined;

    if (!projecto) {
      throw new SchematicsException(`Projecto "${nomeProjecto ?? '(nenhum)'}" não encontrado.`);
    }

    const nome = strings.dasherize(options.name);
    if (!nome) throw new SchematicsException('O nome da página não pode ser vazio.');

    const shell = SHELL[options.layout] ?? SHELL.blank;
    const destino = options.path ?? `${projecto.sourceRoot ?? 'src'}/app/pages/${nome}`;

    const templates = apply(url('./files'), [
      options.skipTests ? filter((caminho) => !caminho.endsWith('.spec.ts.template')) : noop(),
      applyTemplates({
        ...strings,
        name: nome,
        toolkit: TOOLKIT,
        shellClass: shell.classe,
        shellSelector: shell.selector,
        resource: options.resource ?? '',
        temResource: Boolean(options.resource),
      }),
      move(destino),
    ]);

    return mergeWith(templates, MergeStrategy.Error);
  };
}
