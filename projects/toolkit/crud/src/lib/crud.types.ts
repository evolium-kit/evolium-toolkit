import { Signal, Type } from '@angular/core';
import type { EvoModalSize } from '@evolium-kit/toolkit/components';
import type { EvoError, EvoHttpVerb } from '@evolium-kit/toolkit/services';
import type { QueryClient } from '@tanstack/angular-query-experimental';

/** Identificador de uma entidade. Compara-se sempre por texto: `5` e `'5'` são o mesmo. */
export type EvoCrudId = string | number;

/** Modo de um formulário ou de uma página de criar/editar. */
export type EvoCrudMode = 'create' | 'update';

/** Operação de escrita que pode falhar. */
export type EvoCrudOperation = 'create' | 'update' | 'remove';

/**
 * Como `one()` resolve um registo:
 * - `cache-only` — só procura na lista já carregada; nunca faz pedido;
 * - `fetch-on-miss` — se não estiver na lista (depois de ela carregar), faz `GET urls.one(id)`.
 */
export type EvoCrudStrategy = 'cache-only' | 'fetch-on-miss';

/** URLs de cada operação, relativas ao `withBaseUrl()`. */
export interface EvoCrudUrls {
  readonly list: () => string;
  readonly one: (id: EvoCrudId) => string;
  readonly create: () => string;
  readonly update: (id: EvoCrudId) => string;
  readonly remove: (id: EvoCrudId) => string;
}

/** Meta da listagem (paginação, totais…), tal como a API a devolve. */
export type EvoCrudListMeta = Readonly<Record<string, unknown>>;

/** Lista desembrulhada: os itens já tipados e, se houver, o meta. */
export interface EvoCrudListResult<T> {
  readonly items: readonly T[];
  readonly meta?: EvoCrudListMeta | null;
}

/**
 * Desembrulha a resposta bruta da listagem. É o único sítio onde `unknown`
 * passa a `T[]`. Devolver `null` diz que o formato não foi reconhecido.
 */
export type EvoCrudListAdapter<T> = (raw: unknown) => EvoCrudListResult<T> | null;

/** Faz um pedido pelo kernel (`baseUrl`, interceptors partilhados, `EvoError`). */
export type EvoCrudRequest = <R = unknown>(
  method: EvoHttpVerb,
  url: string,
  body?: unknown,
) => Promise<R>;

/** O que cada hook recebe como primeiro argumento. */
export interface EvoCrudHookContext {
  /** O `path` do resource, ex.: `'/usuarios'`. */
  readonly path: string;
  readonly urls: EvoCrudUrls;
  readonly queryClient: QueryClient;
  readonly request: EvoCrudRequest;
}

/** Detalhe de um erro passado ao hook `onError`. */
export interface EvoCrudErrorDetails {
  /**
   * `true` quando o erro já está a ser mostrado no formulário aberto (campo a
   * campo ou no `formError`). Um hook de avisos não deve abrir outro por cima.
   */
  readonly shownInForm: boolean;
}

/** Decisão de `beforeRemove`: `false` cancela; `'handled'` diz que o hook já apagou à sua maneira. */
export type EvoCrudRemoveDecision = boolean | 'handled' | void;

/**
 * Hooks de um resource. Todos opcionais, síncronos ou assíncronos.
 *
 * - **Transformadores** (`afterList`, `beforeCreate`, `beforeUpdate`): devolver
 *   um valor substitui-o; `undefined` mantém o anterior. Correm em cadeia.
 * - **Canceláveis** (`beforeRemove`, `beforeOpenForm`): `false` interrompe, e
 *   os hooks seguintes não correm.
 * - **Notificações** (`after*`, `onError`, `afterCloseForm`): correm todos; um
 *   hook que falhe não pára os outros nem a operação (emite `crud:hook-error`).
 *
 * Os globais (`withPlugin(crudPlugin(), { hooks })`) correm antes dos locais.
 */
export interface EvoCrudHooks<T = unknown, D = unknown> {
  /** Identifica o hook nos erros. */
  readonly name: string;

  afterList?(ctx: EvoCrudHookContext, items: readonly T[]): MaybePromise<readonly T[] | void>;
  beforeCreate?(ctx: EvoCrudHookContext, dto: D): MaybePromise<D | void>;
  /** Corre com o pedido e a revalidação da lista já terminados. */
  afterCreate?(ctx: EvoCrudHookContext, created: T): MaybePromise<void>;
  beforeUpdate?(ctx: EvoCrudHookContext, change: EvoCrudChange<D>): MaybePromise<EvoCrudChange<D> | void>;
  afterUpdate?(ctx: EvoCrudHookContext, updated: T): MaybePromise<void>;
  /** `false` cancela o DELETE; `'handled'` substitui-o (ex.: soft-delete) e o `afterRemove` corre na mesma. */
  beforeRemove?(ctx: EvoCrudHookContext, id: EvoCrudId): MaybePromise<EvoCrudRemoveDecision>;
  /** Não corre se o `beforeRemove` cancelou. */
  afterRemove?(ctx: EvoCrudHookContext, id: EvoCrudId): MaybePromise<void>;
  onError?(
    ctx: EvoCrudHookContext,
    error: EvoError,
    operation: EvoCrudOperation,
    details: EvoCrudErrorDetails,
  ): MaybePromise<void>;

  /** Só no controller. `false` impede abrir o formulário. */
  beforeOpenForm?(ctx: EvoCrudHookContext, mode: EvoCrudMode, item?: T): MaybePromise<boolean | void>;
  /** Só no controller. Corre uma vez sempre que o formulário fecha, seja como for. */
  afterCloseForm?(ctx: EvoCrudHookContext, mode: EvoCrudMode): MaybePromise<void>;
}

/** Alteração passada ao `beforeUpdate`. */
export interface EvoCrudChange<D> {
  readonly id: EvoCrudId;
  readonly dto: D;
}

export type MaybePromise<T> = T | Promise<T>;

/** Configuração de `injectCrudResource()`. */
export interface EvoCrudResourceConfig<T, D = Partial<T>> {
  /** Caminho base, ex.: `'/usuarios'`. Dá os URLs por omissão e a `queryKey`. */
  readonly path: string;
  /** Campo identificador. Por omissão, `'id'`. */
  readonly idKey?: keyof T & string;
  /** Sobrepõe URLs individualmente. */
  readonly urls?: Partial<EvoCrudUrls>;
  /** Por omissão, `'cache-only'`. */
  readonly strategy?: EvoCrudStrategy;
  /**
   * Como desembrulhar a lista: omitido detecta sozinho (array, `.data`,
   * `.items`, `.results`, `.data.data`, `.data.items`); uma string é um
   * caminho (`'result.rows'`); uma função é um adaptador completo.
   */
  readonly response?: string | EvoCrudListAdapter<T>;
  /** Se a lista carrega sozinha. Por omissão, `true`. Aceita um signal. */
  readonly enabled?: boolean | (() => boolean);
  /**
   * Se a lista é pedida também no render do servidor. Por omissão, `false`:
   * sem transferência de estado, o pedido repetia-se no browser.
   */
  readonly ssr?: boolean;
  /** Hooks só deste resource, depois dos globais. */
  readonly hooks?: readonly EvoCrudHooks<T, D>[];
}

/** Opções de uma escrita. */
export interface EvoCrudWriteOptions {
  /** Corre entre o fim do pedido e os hooks `after*` — é onde o controller fecha o formulário. */
  readonly beforeNotify?: () => void;
  /** Ver `EvoCrudErrorDetails.shownInForm`. */
  readonly shownInForm?: boolean;
}

/** Um registo resolvido por `one()`. */
export interface EvoCrudOne<T> {
  readonly item: Signal<T | null>;
  readonly loading: Signal<boolean>;
}

/** O que `injectCrudResource()` devolve. */
export interface EvoCrudResource<T, D = Partial<T>> {
  readonly path: string;
  readonly idKey: keyof T & string;
  readonly urls: EvoCrudUrls;

  /** Itens da lista, já desembrulhados e passados pelo `afterList`. */
  readonly items: Signal<readonly T[]>;
  /** Meta da última resposta da lista, mesmo vinda do cache. */
  readonly meta: Signal<EvoCrudListMeta | null>;
  /** Primeiro carregamento da lista. */
  readonly loading: Signal<boolean>;
  /** Qualquer pedido da lista em curso, incluindo revalidações. */
  readonly fetching: Signal<boolean>;
  readonly error: Signal<EvoError | null>;
  readonly creating: Signal<boolean>;
  readonly updating: Signal<boolean>;
  readonly removing: Signal<boolean>;

  /** Volta a pedir a lista. */
  refresh(): Promise<void>;
  /** Cria. Rejeita com `EvoError`. Os hooks `after*` correm depois da lista revalidada. */
  create(dto: D, options?: EvoCrudWriteOptions): Promise<T>;
  update(id: EvoCrudId, dto: D, options?: EvoCrudWriteOptions): Promise<T>;
  /** Resolve `false` quando um `beforeRemove` cancelou. */
  remove(id: EvoCrudId, options?: EvoCrudWriteOptions): Promise<boolean>;

  /** Procura na lista carregada, sem pedidos. */
  peek(id: EvoCrudId): T | undefined;
  /** Um registo, reactivo ao `id`, segundo a `strategy`. Pode ser chamado fora de contexto de injecção. */
  one(id: () => EvoCrudId | null | undefined): EvoCrudOne<T>;
  /** O id de um item, pelo `idKey`. */
  idOf(item: T): EvoCrudId;
}

/** Onde o formulário de uma acção aparece. */
export interface EvoCrudDisplay {
  readonly mode: 'modal' | 'route';
  /** Largura do modal desta acção. */
  readonly size?: EvoModalSize;
  /** Obrigatório com `mode: 'route'`. Recebe o id (nenhum ao criar). */
  readonly routePath?: (id?: EvoCrudId) => string;
}

/** Configuração de `injectCrudController()`. */
export interface EvoCrudControllerConfig<T, D = Partial<T>> extends EvoCrudResourceConfig<T, D> {
  /** Componente standalone do formulário. Usa `injectCrudForm()`. */
  readonly form: Type<unknown>;
  readonly titles?: { readonly create?: string; readonly update?: string };
  readonly display?: {
    readonly create?: EvoCrudDisplay['mode'] | EvoCrudDisplay;
    readonly update?: EvoCrudDisplay['mode'] | EvoCrudDisplay;
    /** Largura por omissão dos dois modais. Por omissão, `'xl'`. */
    readonly size?: EvoModalSize;
  };
  /** `true` (omissão) confirma com a mensagem genérica, `false` não confirma, uma função dá a mensagem. */
  readonly confirmRemove?: boolean | ((item: T) => string);
}

/** O que `injectCrudController()` devolve. */
export interface EvoCrudController<T, D = Partial<T>> {
  readonly resource: EvoCrudResource<T, D>;
  openCreate(): void;
  openEdit(item: T): void;
  /** Confirma (se configurado) e apaga. Uma falha é sempre mostrada. */
  remove(item: T): void;
}
