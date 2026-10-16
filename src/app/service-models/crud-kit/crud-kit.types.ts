import { Signal, Type } from '@angular/core';
import type { CrudKitPlugin } from './crud-kit-plugin.types';
import { AlertModelTamanho } from '../../components/modal-generico/modal-generico.types';

/** Identificador único de uma entidade — aceita tanto string quanto number. */
export type ID = string | number;

/** Modo de uma página de rota resolvido por `useCrudPageState`: sem id na rota → 'criar', com id → 'atualizar'. */
export type CrudMode = 'criar' | 'atualizar';

/**
 * Estratégia usada por `pegarUmQuery` para resolver um único registro:
 * - 'cache-only': nunca faz requisição extra, só busca dentro do cache do `list`.
 * - 'fetch-on-miss': se o item não estiver no cache do `list` após o carregamento, dispara um GET individual.
 */
export type FetchStrategy = 'cache-only' | 'fetch-on-miss';

/** Conjunto de URLs usadas pelas operações CRUD de um recurso. */
export interface CrudUrls {
  /** URL usada para listar todos os registros (GET). */
  pegarTodos: () => string;
  /** URL usada para buscar um único registro pelo id (GET). */
  pegarUm: (id: ID) => string;
  /** URL usada para criar um novo registro (POST). */
  salvar: () => string;
  /** URL usada para atualizar um registro existente pelo id (PUT). */
  atualizar: (id: ID) => string;
  /** URL usada para apagar um registro pelo id (DELETE). */
  apagar: (id: ID) => string;
}

/** Meta de paginação/estatísticas extraída (quando disponível) da resposta bruta da listagem. */
export interface CrudListMeta {
  currentPage?: number;
  lastPage?: number;
  total?: number;
  perPage?: number;
  [key: string]: unknown;
}

/** Resultado normalizado de uma listagem: array de entidades já tipado, mais um meta opcional. */
export interface CrudListResult<TEntity> {
  items: TEntity[];
  meta?: CrudListMeta;
}

/**
 * Recebe o corpo bruto da resposta HTTP (tipo `unknown`, pois o formato real varia por
 * endpoint) e devolve o array de entidades já tipado, mais um meta de paginação opcional.
 * O cast de `unknown` para `TEntity[]` deve acontecer SOMENTE dentro do adaptador, nunca
 * fora dele.
 */
export type CrudListAdapter<TEntity> = (raw: unknown) => CrudListResult<TEntity>;

/** Configuração usada por `createCrudResource` para expor as queries/mutations de uma entidade. */
export interface CrudResourceConfig<TEntity extends Record<string, any>, TDto = Partial<TEntity>> {
  /** Caminho base do recurso, ex: '/usuarios'. Usado para derivar as URLs padrão e a queryKey. */
  resource: string;
  /** Chave usada como identificador único da entidade. Default: 'id'. */
  idKey?: keyof TEntity;
  /** Permite sobrescrever qualquer URL individualmente (merge raso com os defaults derivados de `resource`). */
  urls?: Partial<CrudUrls>;
  /**
   * Estratégia de busca de um único registro (usada por `pegarUmQuery`):
   * - 'cache-only' (default): nunca faz requisição extra, só busca dentro do cache de `list`.
   * - 'fetch-on-miss': se o item não estiver no cache do `list` após o carregamento, dispara um GET individual (urls.pegarUm).
   */
  strategy?: FetchStrategy;
  /**
   * Como extrair o array de entidades (e opcionalmente meta) da resposta bruta da API.
   * - undefined (default): tenta auto-detectar (array puro, `.data`, `.items`, `.results`, `.data.data`, `.data.items`).
   * - string: shorthand de caminho de acesso, ex: `'data'` ou `'result.rows'`.
   * - função: adaptador completo (`CrudListAdapter<TEntity>`), para formatos que a auto-detecção não cobre.
   */
  resposta?: string | CrudListAdapter<TEntity>;
  /**
   * Controla se a query de listagem deve buscar automaticamente.
   * Default: true. Use false em páginas que só precisam de pegarUmQuery
   * (ex: tela de criar/editar), evitando um GET da lista completa desnecessário.
   */
  listaAtiva?: boolean | Signal<boolean>;
  /**
   * Plugins locais — hooks que interceptam/estendem o comportamento deste recurso
   * específico (ver `crud-kit-plugin.types.ts`). Somam-se aos plugins globais
   * registados via `provideCrudKitPlugins()` (globais correm primeiro).
   */
  plugins?: CrudKitPlugin<TEntity, TDto>[];
}

/** Onde/como o formulário de criar/editar é exibido. */
export type DisplayMode = 'modal' | 'drawer' | 'route';

/** Configuração completa de exibição de uma ação (`criar` ou `editar`). */
export interface DisplayModeConfig {
  /** Modo de exibição do formulário. */
  mode: DisplayMode;
  tamanhoModal?: AlertModelTamanho
  /** Obrigatório quando `mode === 'route'`. Recebe o id (undefined para criação) e retorna o path da rota. */
  routePath?: (id?: ID) => string;
}

/** Configuração usada por `createCrudController`, superset de `CrudResourceConfig`. */
export interface CrudControllerConfig<TEntity extends Record<string, any>, TDto = Partial<TEntity>>
  extends CrudResourceConfig<TEntity, TDto> {
  /** Componente standalone usado como formulário de criar/editar. Deve consumir `useCrudFormBridge`. */
  formComponent: Type<any>;
  /** Títulos exibidos no header do modal/drawer de criar/editar. */
  titulos?: {
    criar?: string;
    editar?: string;
  };
  /** Controla onde cada ação (criar/editar) é exibida. Default: `{ mode: 'modal' }` para ambas. */
  display?: {
    criar?: DisplayMode | DisplayModeConfig;
    editar?: DisplayMode | DisplayModeConfig;
    tamanhoModal?: AlertModelTamanho;
  };
  /**
   * Controla a confirmação antes de apagar.
   * - true (default): mostra modal de confirmação com mensagem genérica.
   * - false: apaga direto, sem confirmação.
   * - function: recebe o item e retorna a mensagem customizada de confirmação.
   */
  confirmarApagar?: boolean | ((item: TEntity) => string);
}
