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

export interface ResourcePluginOptions {
  name: string;
  project?: string;
  path?: string;
  dependsOn: string;
  endpoints: string;
  skipTests: boolean;
}

const OPERACOES_VALIDAS = ['list', 'get', 'create', 'update', 'remove'] as const;
type Operacao = (typeof OPERACOES_VALIDAS)[number];

/** Gera um plugin de serviço completo: modelos, mappers, endpoints e testes. */
export function resourcePlugin(options: ResourcePluginOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await readWorkspace(tree);
    const nomeProjecto = options.project ?? [...workspace.projects.keys()][0];
    const projecto = nomeProjecto ? workspace.projects.get(nomeProjecto) : undefined;

    if (!projecto) {
      throw new SchematicsException(`Projecto "${nomeProjecto ?? '(nenhum)'}" não encontrado.`);
    }

    const nome = strings.dasherize(options.name);
    if (!nome) throw new SchematicsException('O nome do resource não pode ser vazio.');

    const destino = options.path ?? `${projecto.sourceRoot ?? 'src'}/app/resources/${nome}`;

    const operacoes = analisarOperacoes(options.endpoints);
    const dependsOn = options.dependsOn
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const templates = apply(url('./files'), [
      options.skipTests ? filter((caminho) => !caminho.endsWith('.spec.ts.template')) : noop(),
      applyTemplates({
        ...strings,
        name: nome,
        // Singular ingénuo, mas previsível: `facturas` -> `Factura`.
        singular: strings.classify(nome).replace(/s$/, ''),
        toolkit: TOOLKIT,
        dependsOn,
        temDependencias: dependsOn.length > 0,
        // O spec tem de registar as dependências declaradas, senão o kernel
        // rejeita o arranque — `auth` é a única que a toolkit sabe construir.
        dependeDeAuth: dependsOn.includes('auth'),
        outrasDependencias: dependsOn.filter((d) => d !== 'auth'),
        op: (nomeOp: Operacao) => operacoes.includes(nomeOp),
      }),
      move(destino),
    ]);

    return mergeWith(templates, MergeStrategy.Error);
  };
}

function analisarOperacoes(bruto: string): readonly Operacao[] {
  const pedidas = bruto
    .split(',')
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);

  const desconhecidas = pedidas.filter((o) => !OPERACOES_VALIDAS.includes(o as Operacao));

  if (desconhecidas.length > 0) {
    throw new SchematicsException(
      `Operações desconhecidas: ${desconhecidas.join(', ')}. ` +
        `Válidas: ${OPERACOES_VALIDAS.join(', ')}.`,
    );
  }

  return pedidas as readonly Operacao[];
}
