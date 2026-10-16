import type { QueryClient } from '@tanstack/angular-query-experimental';
import type { ID } from './crud-kit.types';

/** Contexto passado a todo hook de plugin — identifica o recurso e dá acesso ao QueryClient. */
export interface CrudPluginContext<TEntity = unknown> {
  /** O `resource` configurado, ex: '/pedidos'. */
  recurso: string;
  queryClient: QueryClient;
}

/**
 * Um plugin é um conjunto de hooks opcionais, registrados globalmente (via
 * `provideCrudKitPlugins`, em `app.config.ts`) ou localmente (via `config.plugins`
 * de um `createCrudResource`/`createCrudController` específico).
 *
 * Todos os hooks podem ser síncronos ou devolver `Promise`. Três formatos:
 * - **Transformador** (`antesDeX`/`depoisDeBuscarLista`): cada plugin pode devolver um
 *   novo valor; devolver `undefined` mantém o valor do plugin anterior. Correm em cadeia,
 *   globais primeiro.
 * - **Cancelável** (`antesDeApagar`, `antesDeAbrirFormulario`): qualquer plugin a devolver
 *   `false` interrompe a operação (os plugins seguintes não correm).
 * - **Notificação** (`depoisDeX`, `aoOcorrerErro`): correm todos, resultado ignorado; um
 *   erro num plugin é isolado (log) e não impede os restantes nem o fluxo principal.
 */
export interface CrudKitPlugin<TEntity extends Record<string, any> = any, TDto = Partial<TEntity>> {
  /** Identificador único, só para debug/logs (ex: mensagens de erro isolado). */
  nome: string;

  // ── Camada de dados (createCrudResource) ──

  /** Transformador. Corre depois do adaptador `resposta` resolver o array da listagem. */
  depoisDeBuscarLista?(ctx: CrudPluginContext<TEntity>, dados: TEntity[]): TEntity[] | void | Promise<TEntity[] | void>;

  /** Transformador. Corre antes do POST de criação. */
  antesDeSalvar?(ctx: CrudPluginContext<TEntity>, dto: TDto): TDto | void | Promise<TDto | void>;

  /**
   * Notificação. Corre no `salvarEConcluir`, com o POST e a revalidação da lista já
   * terminados — nunca dentro do `mutationFn`, onde a mutation ainda está `pending`.
   */
  depoisDeSalvar?(ctx: CrudPluginContext<TEntity>, resultado: TEntity): void | Promise<void>;

  /** Transformador. Corre antes do PUT de atualização. */
  antesDeAtualizar?(
    ctx: CrudPluginContext<TEntity>,
    payload: { id: ID; dto: TDto },
  ): { id: ID; dto: TDto } | void | Promise<{ id: ID; dto: TDto } | void>;

  /** Notificação. Corre no `atualizarEConcluir`, nas mesmas condições de `depoisDeSalvar`. */
  depoisDeAtualizar?(ctx: CrudPluginContext<TEntity>, resultado: TEntity): void | Promise<void>;

  /** Cancelável. Devolver `false` cancela o DELETE real (soft-delete, confirmação custom, permissões). */
  antesDeApagar?(ctx: CrudPluginContext<TEntity>, id: ID): boolean | void | Promise<boolean | void>;

  /**
   * Notificação. Corre no `apagarEConcluir`, depois do DELETE ter sucesso. Não corre
   * quando `antesDeApagar` cancelou a chamada — nesse caso o side-effect que a
   * substituiu é que decide o que anunciar.
   */
  depoisDeApagar?(ctx: CrudPluginContext<TEntity>, id: ID): void | Promise<void>;

  /** Notificação. Corre quando salvar/atualizar/apagar falham. */
  aoOcorrerErro?(
    ctx: CrudPluginContext<TEntity>,
    erro: unknown,
    operacao: 'salvar' | 'atualizar' | 'apagar',
  ): void | Promise<void>;

  // ── Camada de orquestração (createCrudController) ──

  /** Cancelável. Devolver `false` impede abrir o modal/drawer/rota. */
  antesDeAbrirFormulario?(
    ctx: CrudPluginContext<TEntity>,
    modo: 'criar' | 'editar',
    item?: TEntity,
  ): boolean | void | Promise<boolean | void>;

  /** Notificação. Corre depois do formulário fechar — tanto ao salvar como ao cancelar. */
  depoisDeFecharFormulario?(ctx: CrudPluginContext<TEntity>, modo: 'criar' | 'editar'): void | Promise<void>;
}
