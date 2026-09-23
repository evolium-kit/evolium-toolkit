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

export interface LayoutOptions {
  name: string;
  project?: string;
  path?: string;
  slots: string;
  skipTests: boolean;
}

/**
 * Gera um shell de aplicação.
 *
 * Os slots são `ng-content` com selector de atributo, e não inputs: um shell
 * define a moldura e não deve conhecer os dados que a preenchem.
 */
export function layout(options: LayoutOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await readWorkspace(tree);
    const nomeProjecto = options.project ?? [...workspace.projects.keys()][0];
    const projecto = nomeProjecto ? workspace.projects.get(nomeProjecto) : undefined;

    if (!projecto) {
      throw new SchematicsException(`Projecto "${nomeProjecto ?? '(nenhum)'}" não encontrado.`);
    }

    const nome = strings.dasherize(options.name);
    if (!nome) throw new SchematicsException('O nome do layout não pode ser vazio.');

    const slots = options.slots
      .split(',')
      .map((s) => strings.dasherize(s.trim()))
      .filter(Boolean);

    const destino = options.path ?? `${projecto.sourceRoot ?? 'src'}/app/layouts/${nome}`;

    const templates = apply(url('./files'), [
      options.skipTests ? filter((caminho) => !caminho.endsWith('.spec.ts.template')) : noop(),
      applyTemplates({ ...strings, name: nome, slots }),
      move(destino),
    ]);

    return mergeWith(templates, MergeStrategy.Error);
  };
}
