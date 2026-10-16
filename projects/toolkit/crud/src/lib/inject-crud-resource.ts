import { Injector, Signal, computed, inject } from '@angular/core';
import { EvoError } from '@evolium-kit/toolkit/services';
import { QueryClient, injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { crudAdapterByPath, crudAutoAdapter, crudIdOf, sameCrudId } from './crud.adapters';
import { CrudHookRunner } from './crud.hooks';
import { EvoCrud, EvoCrudApi } from './crud.plugin';
import {
  EvoCrudChange,
  EvoCrudHookContext,
  EvoCrudHooks,
  EvoCrudId,
  EvoCrudListAdapter,
  EvoCrudListResult,
  EvoCrudOne,
  EvoCrudOperation,
  EvoCrudResource,
  EvoCrudResourceConfig,
  EvoCrudUrls,
  EvoCrudWriteOptions,
} from './crud.types';

/** Resultado de um DELETE, para a mutation saber se há algo a revalidar. */
type Remocao = 'removed' | 'handled' | 'cancelled';

/** Interno: o resource com o que o controller precisa e o consumidor não. */
export interface CrudResourceInternals<T, D> {
  readonly runner: CrudHookRunner<T, D>;
  readonly api: EvoCrudApi;
}

const INTERNOS = new WeakMap<object, CrudResourceInternals<never, never>>();

/** @internal Usado pelo controller para reaproveitar os hooks já resolvidos. */
export function crudResourceInternals<T, D>(
  resource: EvoCrudResource<T, D>,
): CrudResourceInternals<T, D> {
  const internos = INTERNOS.get(resource);
  if (!internos) throw new Error('[evo] crud: resource não criado por injectCrudResource().');
  return internos as unknown as CrudResourceInternals<T, D>;
}

function requererApi(): EvoCrudApi {
  const api = inject(EvoCrud, { optional: true });
  if (!api) {
    throw new Error(
      '[evo] injectCrudResource(): falta withPlugin(crudPlugin()) no provideEvoServices().',
    );
  }
  return api;
}

function requererQueryClient(): QueryClient {
  const cliente = inject(QueryClient, { optional: true });
  if (!cliente) {
    throw new Error(
      '[evo] injectCrudResource(): falta provideTanStackQuery(new QueryClient()) no app.config.ts.',
    );
  }
  return cliente;
}

/**
 * Lista, cria, actualiza e apaga uma entidade, sobre TanStack Query.
 *
 * Chama `inject()` — usar num campo de classe ou no construtor:
 *
 * ```ts
 * readonly usuarios = injectCrudResource<Usuario, UsuarioDto>({ path: '/usuarios' });
 * ```
 *
 * As escritas (`create`/`update`/`remove`) são a única forma de mudar dados, e
 * correm sempre os hooks: os `after*` só depois de o pedido **e** a revalidação
 * da lista terminarem, para um aviso de sucesso não aparecer por baixo do
 * carregamento.
 */
export function injectCrudResource<T extends object, D = Partial<T>>(
  config: EvoCrudResourceConfig<T, D>,
): EvoCrudResource<T, D> {
  const api = requererApi();
  const queryClient = requererQueryClient();
  const injector = inject(Injector);

  const path = config.path;
  const idKey = (config.idKey ?? 'id') as keyof T & string;
  const urls: EvoCrudUrls = {
    list: () => path,
    one: (id) => `${path}/${id}`,
    create: () => path,
    update: (id) => `${path}/${id}`,
    remove: (id) => `${path}/${id}`,
    ...config.urls,
  };
  const adaptador: EvoCrudListAdapter<T> =
    typeof config.response === 'string'
      ? crudAdapterByPath<T>(config.response)
      : (config.response ?? crudAutoAdapter<T>());

  const ctx: EvoCrudHookContext = { path, urls, queryClient, request: api.request };
  // Os globais são EvoCrudHooks<unknown, unknown>: os parâmetros dos métodos são
  // bivariantes, mas os retornos não — daí o cast, o único deste ficheiro.
  const hooks = [...(api.hooks as readonly EvoCrudHooks<T, D>[]), ...(config.hooks ?? [])];
  const runner = new CrudHookRunner<T, D>(hooks, ctx, (e) => api.reportHookError(e));

  const activa = (): boolean => {
    const enabled = config.enabled ?? true;
    const ligada = typeof enabled === 'function' ? enabled() : enabled;
    return ligada && (config.ssr === true || !api.isServer);
  };

  // A query guarda itens E meta: com o meta fora da cache, uma segunda
  // instância servida pela cache ficava sempre com meta `null`.
  const lista = injectQuery(
    () => ({
      queryKey: [path, 'list'],
      queryFn: async (): Promise<EvoCrudListResult<T>> => {
        const raw = await api.request<unknown>('GET', urls.list());
        const desembrulhado = adaptador(raw);
        if (!desembrulhado) api.reportUnrecognized(path, raw);
        const items = await runner.transform<readonly T[]>(
          'afterList',
          desembrulhado?.items ?? [],
        );
        return { items, meta: desembrulhado?.meta ?? null };
      },
      enabled: activa(),
    }),
    { injector },
  );

  const revalidar = (): Promise<void> => queryClient.invalidateQueries({ queryKey: [path] });

  const criar = injectMutation(
    () => ({
      mutationKey: [path, 'create'],
      mutationFn: async (dto: D) => {
        const payload = await runner.transform('beforeCreate', dto);
        return api.request<T>('POST', urls.create(), payload);
      },
      onSuccess: revalidar,
    }),
    { injector },
  );

  const actualizar = injectMutation(
    () => ({
      mutationKey: [path, 'update'],
      mutationFn: async (change: EvoCrudChange<D>) => {
        const final = await runner.transform('beforeUpdate', change);
        return api.request<T>('PUT', urls.update(final.id), final.dto);
      },
      onSuccess: revalidar,
    }),
    { injector },
  );

  const apagar = injectMutation(
    () => ({
      mutationKey: [path, 'remove'],
      mutationFn: async (id: EvoCrudId): Promise<Remocao> => {
        const decisao = await runner.decide('beforeRemove', id);
        if (decisao === false) return 'cancelled';
        if (decisao === 'handled') return 'handled';
        await api.request('DELETE', urls.remove(id));
        return 'removed';
      },
      onSuccess: (r: Remocao) => (r === 'cancelled' ? undefined : revalidar()),
    }),
    { injector },
  );

  async function escrever<R>(
    operacao: EvoCrudOperation,
    pedido: () => Promise<R>,
    options: EvoCrudWriteOptions | undefined,
  ): Promise<R> {
    try {
      return await pedido();
    } catch (erro) {
      const normalizado = api.toError(erro);
      await runner.notify('onError', normalizado, operacao, {
        shownInForm: options?.shownInForm ?? false,
      });
      throw normalizado;
    }
  }

  const items = computed<readonly T[]>(() => lista.data()?.items ?? []);

  function peek(id: EvoCrudId): T | undefined {
    return items().find((item) => sameCrudId(item[idKey], id));
  }

  function one(idFn: () => EvoCrudId | null | undefined): EvoCrudOne<T> {
    const daLista = computed<T | null>(() => {
      const id = idFn();
      return id === null || id === undefined
        ? null
        : (items().find((item) => sameCrudId(item[idKey], id)) ?? null);
    });

    // Com 'cache-only', `pedir` nunca é true e a query fica sempre desligada.
    const pedir = computed(
      () =>
        config.strategy === 'fetch-on-miss' &&
        !lista.isLoading() &&
        idFn() !== null &&
        idFn() !== undefined &&
        daLista() === null &&
        (config.ssr === true || !api.isServer),
    );

    const individual = injectQuery(
      () => ({
        queryKey: [path, 'one', String(idFn())],
        queryFn: () => api.request<T>('GET', urls.one(idFn() as EvoCrudId)),
        enabled: pedir(),
      }),
      { injector },
    );
    // Com `T` genérico, o tipo mapeado do TanStack não prova que `data` não é
    // uma função; em runtime é sempre um Signal, que é um dos membros da união.
    const dado = individual.data as Signal<T | undefined>;

    return {
      item: computed(() => daLista() ?? dado() ?? null),
      loading: computed(() => lista.isLoading() || (pedir() && individual.isLoading())),
    };
  }

  const resource: EvoCrudResource<T, D> = {
    path,
    idKey,
    urls,
    items,
    meta: computed(() => lista.data()?.meta ?? null),
    loading: computed(() => lista.isLoading()),
    fetching: computed(() => lista.isFetching()),
    error: computed(() => {
      const erro = lista.error();
      return erro ? (erro instanceof EvoError ? erro : api.toError(erro)) : null;
    }),
    creating: computed(() => criar.isPending()),
    updating: computed(() => actualizar.isPending()),
    removing: computed(() => apagar.isPending()),

    async refresh() {
      await lista.refetch();
    },

    async create(dto, options) {
      const criado = await escrever('create', () => criar.mutateAsync(dto), options);
      options?.beforeNotify?.();
      await runner.notify('afterCreate', criado);
      return criado;
    },

    async update(id, dto, options) {
      const actualizado = await escrever(
        'update',
        () => actualizar.mutateAsync({ id, dto }),
        options,
      );
      options?.beforeNotify?.();
      await runner.notify('afterUpdate', actualizado);
      return actualizado;
    },

    async remove(id, options) {
      const resultado = await escrever('remove', () => apagar.mutateAsync(id), options);
      // Cancelado: não houve remoção, logo nada a anunciar.
      if (resultado === 'cancelled') return false;
      options?.beforeNotify?.();
      await runner.notify('afterRemove', id);
      return true;
    },

    peek,
    one,
    idOf: (item) => crudIdOf(item, idKey),
  };

  INTERNOS.set(resource, { runner, api } as unknown as CrudResourceInternals<never, never>);
  return resource;
}
