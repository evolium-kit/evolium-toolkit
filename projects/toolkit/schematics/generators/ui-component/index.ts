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

export interface UiComponentOptions {
  name: string;
  project?: string;
  path?: string;
  category: string;
  variants: string;
  skipTests: boolean;
}

/**
 * Gera um componente temável já conforme as duas regras de ouro do CSS.
 *
 * O esqueleto traz o `var(--evo-x, fallback)` correcto e os metadados para o
 * Theme Studio: é mais fácil manter a regra do que a explicar depois de violada.
 */
export function uiComponent(options: UiComponentOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await readWorkspace(tree);
    const nomeProjecto = options.project ?? [...workspace.projects.keys()][0];
    const projecto = nomeProjecto ? workspace.projects.get(nomeProjecto) : undefined;

    if (!projecto) {
      throw new SchematicsException(`Projecto "${nomeProjecto ?? '(nenhum)'}" não encontrado.`);
    }

    const nome = strings.dasherize(options.name);
    if (!nome) throw new SchematicsException('O nome do componente não pode ser vazio.');

    const variantes = options.variants
      .split(',')
      .map((v) => strings.dasherize(v.trim()))
      .filter(Boolean);

    const destino = options.path ?? `${projecto.sourceRoot ?? 'src'}/app/ui/${nome}`;

    const templates = apply(url('./files'), [
      options.skipTests ? filter((caminho) => !caminho.endsWith('.spec.ts.template')) : noop(),
      applyTemplates({
        ...strings,
        name: nome,
        toolkit: TOOLKIT,
        category: options.category,
        variants: variantes,
        temVariantes: variantes.length > 0,
      }),
      move(destino),
    ]);

    return mergeWith(templates, MergeStrategy.Error);
  };
}
