import { InjectionToken } from '@angular/core';
import {
  EvoError,
  EvoHttpVerb,
  EvoPlugin,
  EvoPluginContext,
  endpoint,
} from '@evolium-kit/toolkit/services';
import { EvoCrudHookError } from './crud.hooks';
import { EvoCrudHooks, EvoCrudRequest } from './crud.types';

/** Configuração de `withPlugin(crudPlugin(), { … })`. */
export interface EvoCrudConfig {
  /**
   * Hooks aplicados a todos os resources, antes dos locais. São **fábricas**:
   * correm no `setup()` do plugin, já em contexto de injecção, por isso podem
   * usar `inject()` (como o `crudToasts()` faz com o `EvoModalService`).
   */
  readonly hooks?: readonly (() => EvoCrudHooks)[];
}

/** A API do plugin. As funções `injectCrud*` usam-na; raramente é preciso directamente. */
export interface EvoCrudApi {
  /** Hooks globais, já construídos. */
  readonly hooks: readonly EvoCrudHooks[];
  /** `true` durante o render no servidor. */
  readonly isServer: boolean;
  /** Pedido pelo kernel: `baseUrl`, interceptors partilhados (Bearer) e erro sempre `EvoError`. */
  readonly request: EvoCrudRequest;
  /** Normaliza um erro qualquer em `EvoError`. */
  toError(error: unknown): EvoError;
  /** Emite `crud:hook-error` no barramento de eventos. */
  reportHookError(error: EvoCrudHookError): void;
  /** Emite `crud:unrecognized-response` — a lista não estava em nenhum formato conhecido. */
  reportUnrecognized(path: string, raw: unknown): void;
}

/** Token dedicado, para quem prefere `inject(EvoCrud)` ao registry. */
export const EvoCrud = new InjectionToken<EvoCrudApi>('EvoCrud');

/** Ponto de extensão de tipos deste plugin, como o `EvoAuthExtensions`. Nasce vazia. */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EvoCrudExtensions {}

declare module '@evolium-kit/toolkit/services' {
  interface EvoResourceMap {
    crud: EvoCrudApi & EvoCrudExtensions;
  }
}

interface Alvo {
  readonly url: string;
}

const caminho = (p: Alvo): string => p.url;

/**
 * Um endpoint por verbo, com o caminho inteiro em parâmetro: os URLs de cada
 * resource só se conhecem em runtime, mas os pedidos passam pelo `ctx.http`
 * como os de qualquer plugin.
 */
const endpoints = {
  GET: endpoint<void, unknown, Alvo>({ method: 'GET', path: caminho }),
  DELETE: endpoint<void, unknown, Alvo>({ method: 'DELETE', path: caminho }),
  POST: endpoint<unknown, unknown, Alvo>({ method: 'POST', path: caminho }),
  PUT: endpoint<unknown, unknown, Alvo>({ method: 'PUT', path: caminho }),
  PATCH: endpoint<unknown, unknown, Alvo>({ method: 'PATCH', path: caminho }),
} as const;

/**
 * CRUD sobre TanStack Query. Regista os hooks globais e dá às funções
 * `injectCrud*` o cliente HTTP do kernel — por isso os pedidos levam o Bearer
 * do `authPlugin()` sem configuração nenhuma.
 *
 * ```ts
 * provideTanStackQuery(new QueryClient()),
 * provideEvoServices(
 *   withBaseUrl('/api'),
 *   withPlugin(authPlugin()),
 *   withPlugin(crudPlugin(), { hooks: [() => crudToasts()] }),
 * ),
 * ```
 */
export function crudPlugin(): EvoPlugin<EvoCrudApi> {
  let api: EvoCrudApi;

  return {
    name: 'crud',
    version: '1.0.0',
    providers: [{ provide: EvoCrud, useFactory: () => api }],

    setup(ctx: EvoPluginContext): EvoCrudApi {
      const config = (ctx.config ?? {}) as EvoCrudConfig;
      const client = ctx.http.client(endpoints);

      const request: EvoCrudRequest = async <R>(
        method: EvoHttpVerb,
        url: string,
        body?: unknown,
      ): Promise<R> => {
        const alvo = { url };
        try {
          const resposta =
            method === 'GET' || method === 'DELETE'
              ? await client[method](alvo)
              : await client[method](body, alvo);
          return resposta as R;
        } catch (erro) {
          throw ctx.toError(erro);
        }
      };

      api = {
        hooks: (config.hooks ?? []).map((fabrica) => fabrica()),
        isServer: ctx.isServer,
        request,
        toError: (erro) => ctx.toError(erro),
        reportHookError: (erro) => ctx.events.emit('crud:hook-error', erro),
        reportUnrecognized: (path, raw) =>
          ctx.events.emit('crud:unrecognized-response', { path, raw }),
      };
      return api;
    },
  };
}
