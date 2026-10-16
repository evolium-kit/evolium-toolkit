import { computed, inject, signal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { CrudListAdapter, CrudListMeta, CrudResourceConfig, CrudUrls, ID } from './crud-kit.types';
import type { CrudPluginContext } from './crud-kit-plugin.types';
import { correrHookCancelavel, correrHookNotificacao, correrHookTransformador, resolveCrudKitPlugins } from './crud-kit-plugin-runner';

/** Acessa um valor aninhado por um caminho `'a.b.c'`, sem lançar se algum nível não existir. */
function getByPath(obj: any, path: string): unknown {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Cria um adaptador a partir de um caminho de acesso simples, ex: `'data'` ou `'result.rows'`.
 * Usado quando `config.resposta` é uma string.
 */
export function criarAdaptadorPorCaminho<TEntity>(
  caminhoDados: string,
  caminhoMeta?: string,
): CrudListAdapter<TEntity> {
  return (raw) => {
    const items = getByPath(raw, caminhoDados);
    const meta = caminhoMeta ? (getByPath(raw, caminhoMeta) as CrudListMeta) : undefined;
    return { items: Array.isArray(items) ? (items as TEntity[]) : [], meta };
  };
}

/**
 * Adaptador padrão usado quando `config.resposta` não é configurado. Tenta reconhecer os
 * formatos de envelope mais comuns (array puro, `.data`, `.items`, `.results`, `.data.data`,
 * `.data.items`). Se nenhum for reconhecido, emite um aviso e devolve uma lista vazia — nunca
 * lança exceção.
 */
export function adaptadorAutoDetectar<TEntity>(): CrudListAdapter<TEntity> {
  return (raw) => {
    if (Array.isArray(raw)) return { items: raw as TEntity[] };

    const candidatos = ['data', 'items', 'results', 'data.data', 'data.items'];
    for (const caminho of candidatos) {
      const valor = getByPath(raw, caminho);
      if (Array.isArray(valor)) {
        const meta = getByPath(raw, 'meta') as CrudListMeta | undefined;
        return { items: valor as TEntity[], meta };
      }
    }

    console.warn(
      '[crud-kit] Não foi possível detectar o array de itens na resposta. Configure a opção "resposta" manualmente.',
      raw,
    );
    return { items: [] };
  };
}

/**
 * Cria as queries/mutations de acesso a dados de uma entidade CRUD.
 *
 * Não é um `@Injectable` — é uma função que usa `inject()` internamente, então só pode
 * ser chamada dentro de um contexto de injeção (campo de classe, construtor, ou dentro
 * de `runInInjectionContext`).
 */
export function createCrudResource<TEntity extends Record<string, any>, TDto = Partial<TEntity>>(
  config: CrudResourceConfig<TEntity, TDto>,
) {
  const http = inject(HttpClient);
  const queryClient = inject(QueryClient);

  const plugins = resolveCrudKitPlugins<TEntity, TDto>(config.plugins);
  const pluginCtx: CrudPluginContext<TEntity> = { recurso: config.resource, queryClient };

  const idKey = (config.idKey ?? 'id') as keyof TEntity;

  const urlsPadrao: CrudUrls = {
    pegarTodos: () => config.resource,
    pegarUm: (id: ID) => `${config.resource}/${id}`,
    salvar: () => config.resource,
    atualizar: (id: ID) => `${config.resource}/${id}`,
    apagar: (id: ID) => `${config.resource}/${id}`,
  };

  const urls: CrudUrls = { ...urlsPadrao, ...config.urls };

  const adaptador: CrudListAdapter<TEntity> =
    typeof config.resposta === 'string'
      ? criarAdaptadorPorCaminho<TEntity>(config.resposta)
      : (config.resposta ?? adaptadorAutoDetectar<TEntity>());

  const listMeta = signal<CrudListMeta | null>(null);

  const list = injectQuery<TEntity[]>(() => ({
    queryKey: [config.resource, 'list'],
    queryFn: async () => {
      const raw = await firstValueFrom(http.get<unknown>(urls.pegarTodos()));
      const { items, meta } = adaptador(raw);
      // Efeito colateral fora do fluxo normal de signals: é a única forma de expor o
      // `meta` de paginação sem disparar uma segunda requisição só para lê-lo.
      listMeta.set(meta ?? null);
      return correrHookTransformador(plugins, 'depoisDeBuscarLista', items, pluginCtx);
    },
    enabled: typeof config.listaAtiva === 'function' ? config.listaAtiva() : (config.listaAtiva ?? true),

  }));

  const invalidarRecurso = () => queryClient.invalidateQueries({ queryKey: [config.resource] });

  const salvar = injectMutation(() => ({
    mutationKey: [config.resource, 'salvar'],
    mutationFn: async (dto: TDto) => {
      const payload = await correrHookTransformador(plugins, 'antesDeSalvar', dto, pluginCtx);
      return firstValueFrom(http.post<TEntity>(urls.salvar(), payload));
    },
    onSuccess: invalidarRecurso,
    onError: (erro: unknown) => correrHookNotificacao(plugins, 'aoOcorrerErro', pluginCtx, erro, 'salvar'),
  }));

  const atualizar = injectMutation(() => ({
    mutationKey: [config.resource, 'atualizar'],
    mutationFn: async ({ id, dto }: { id: ID; dto: TDto }) => {
      const payload = await correrHookTransformador(plugins, 'antesDeAtualizar', { id, dto }, pluginCtx);
      return firstValueFrom(http.put<TEntity>(urls.atualizar(payload.id), payload.dto));
    },
    onSuccess: invalidarRecurso,
    onError: (erro: unknown) => correrHookNotificacao(plugins, 'aoOcorrerErro', pluginCtx, erro, 'atualizar'),
  }));

  const apagar = injectMutation(() => ({
    mutationKey: [config.resource, 'apagar'],
    /** Devolve `false` quando um plugin cancelou o DELETE (ex: soft-delete). */
    mutationFn: async (id: ID) => {
      const prosseguir = await correrHookCancelavel(plugins, 'antesDeApagar', pluginCtx, id);
      if (!prosseguir) return false;
      await firstValueFrom(http.delete(urls.apagar(id)));
      return true;
    },
    onSuccess: invalidarRecurso,
    onError: (erro: unknown) => correrHookNotificacao(plugins, 'aoOcorrerErro', pluginCtx, erro, 'apagar'),
  }));

  /**
   * Os hooks `depoisDeX` não podem correr dentro do `mutationFn`: nessa altura a mutation
   * ainda está `pending` — o TanStack só a dá por concluída depois de `onSuccess`/`onSettled`
   * resolverem, e o `onSuccess` daqui espera pela revalidação da lista. Um plugin que
   * mostre uma mensagem (o `pluginToastAutomatico`) apareceria por baixo do overlay de
   * carregamento, com a lista ainda por actualizar.
   *
   * Nestes invólucros o hook corre depois do `mutateAsync` resolver, quando `isPending()`
   * já é `false`. `antesDeNotificar` corre no meio — é onde o controller fecha o
   * formulário, para a mensagem aparecer sobre a listagem e não sobre o formulário.
   *
   * Prefira-os a `salvar.mutate(...)`/`atualizar.mutate(...)`/`apagar.mutate(...)`: chamar
   * a mutation directamente faz o pedido, mas não corre nenhum hook `depoisDeX`.
   */
  async function salvarEConcluir(dto: TDto, antesDeNotificar?: () => void): Promise<TEntity> {
    const resultado = await salvar.mutateAsync(dto);
    antesDeNotificar?.();
    await correrHookNotificacao(plugins, 'depoisDeSalvar', pluginCtx, resultado);
    return resultado;
  }

  async function atualizarEConcluir(id: ID, dto: TDto, antesDeNotificar?: () => void): Promise<TEntity> {
    const resultado = await atualizar.mutateAsync({ id, dto });
    antesDeNotificar?.();
    await correrHookNotificacao(plugins, 'depoisDeAtualizar', pluginCtx, resultado);
    return resultado;
  }

  async function apagarEConcluir(id: ID, antesDeNotificar?: () => void): Promise<void> {
    // Cancelado por um plugin: não houve DELETE, logo não há nada a anunciar.
    if (!(await apagar.mutateAsync(id))) return;

    antesDeNotificar?.();
    await correrHookNotificacao(plugins, 'depoisDeApagar', pluginCtx, id);
  }

  /** Busca síncrona dentro do cache de `list`, sem disparar nenhuma requisição. */
  function pegarUm(id: ID): TEntity | undefined {
    return list.data()?.find((item) => item[idKey] === id);
  }

  /**
   * Resolve um único registro de acordo com `config.strategy`.
   * Recebe uma função (não um Signal direto) para permitir ids computados/dinâmicos.
   */
  function pegarUmQuery(idSignal: () => ID | null | undefined): {
    data: Signal<TEntity | null>;
    isLoading: Signal<boolean>;
  } {
    const fromCache = computed<TEntity | null>(() => {
      const id = idSignal();
      if (id == null) return null;
      return list.data()?.find((item) => item[idKey] === id) ?? null;
    });

    // Em 'cache-only' (default), `shouldFetch` nunca é `true` — a query individual abaixo
    // fica sempre `enabled: false` e nenhuma requisição extra é disparada.
    const shouldFetch = computed(
      () => config.strategy === 'fetch-on-miss' && !list.isLoading() && idSignal() != null && fromCache() == null,
    );

    const singleQuery = injectQuery<TEntity>(() => ({
      queryKey: [config.resource, 'um', idSignal()],
      queryFn: () => firstValueFrom(http.get<TEntity>(urls.pegarUm(idSignal()!))),
      enabled: shouldFetch(),
    }));

    // `TEntity` é um parâmetro genérico "cru" aqui, então o tipo mapeado da lib
    // (`MapToSignals`) não consegue provar em tempo de compilação que `data` não é uma
    // Function — no runtime é sempre um Signal normal, então o cast é seguro.
    const singleData = singleQuery.data as unknown as Signal<TEntity | undefined>;

    const data = computed<TEntity | null>(() => fromCache() ?? singleData() ?? null);
    const isLoading = computed(() => list.isLoading() || (shouldFetch() && singleQuery.isLoading()));

    return { data, isLoading };
  }

  return {
    list,
    listMeta,
    salvar,
    atualizar,
    apagar,
    salvarEConcluir,
    atualizarEConcluir,
    apagarEConcluir,
    pegarUm,
    pegarUmQuery,
    urls,
    idKey,
    plugins,
  };
}
