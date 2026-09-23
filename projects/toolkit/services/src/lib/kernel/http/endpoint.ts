export type EvoHttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Ausência de parâmetros de rota.
 *
 * `Record<string, never>` não serve: o seu `keyof` é `string`, não `never`, o
 * que faria `SemParams` dar sempre falso e obrigaria a passar um objecto vazio
 * em todas as chamadas.
 */
export type EvoNoParams = Record<never, never>;

export interface EvoEndpoint<TBody, TRes, TParams extends object = EvoNoParams> {
  readonly method: EvoHttpVerb;
  /** Template com `:parametro`, ou função que o constrói a partir de `params`. */
  readonly path: string | ((params: TParams) => string);
  /** DTO da wire para modelo de domínio. */
  readonly mapResponse?: (dto: unknown) => TRes;
  /** Modelo de domínio para DTO da wire. */
  readonly mapRequest?: (body: TBody) => unknown;
  /**
   * Não marca o pedido com o id do plugin, logo não passa pelos interceptors
   * dele. Obrigatório em login, registo, recuperação de senha e **sobretudo no
   * refresh** — um refresh que leve o interceptor de auth entra em ciclo
   * infinito ao responder 401.
   */
  readonly anonymous?: boolean;
  readonly headers?: Readonly<Record<string, string>>;

  /** Phantom types. Nunca lidos em runtime. */
  readonly __body?: TBody;
  readonly __res?: TRes;
  readonly __params?: TParams;
}

/**
 * Define um endpoint.
 *
 * ```ts
 * const endpoints = {
 *   list: endpoint<void, readonly FacturaDto[]>({ method: 'GET', path: '/facturas' }),
 *   get: endpoint<void, FacturaDto, { id: string }>({ method: 'GET', path: '/facturas/:id' }),
 *   create: endpoint<NovaFactura, FacturaDto>({ method: 'POST', path: '/facturas' }),
 * } as const;
 * ```
 */
export function endpoint<TBody = void, TRes = void, TParams extends object = EvoNoParams>(
  definicao: Omit<EvoEndpoint<TBody, TRes, TParams>, '__body' | '__res' | '__params'>,
): EvoEndpoint<TBody, TRes, TParams> {
  return definicao as EvoEndpoint<TBody, TRes, TParams>;
}

export type EvoEndpointMap = Record<string, EvoEndpoint<any, any, any>>;

/** `true` se o tipo for vazio, isto é, se não houver parâmetros de rota. */
type SemParams<P> = [keyof P] extends [never] ? true : false;

/**
 * Deriva a assinatura do cliente a partir do mapa de endpoints.
 *
 * O corpo vem primeiro e os parâmetros depois, e ambos desaparecem da
 * assinatura quando não existem — é o que faz `client.list()` e
 * `client.create(dados)` funcionarem sem argumentos a mais.
 */
export type EvoClient<M extends EvoEndpointMap> = {
  [K in keyof M]: M[K] extends EvoEndpoint<infer B, infer R, infer P>
    ? [B] extends [void]
      ? SemParams<P> extends true
        ? () => Promise<R>
        : (params: P) => Promise<R>
      : SemParams<P> extends true
        ? (body: B) => Promise<R>
        : (body: B, params: P) => Promise<R>
    : never;
};

/** Substitui `:parametro` no caminho e devolve o resultado. */
export function resolvePath(
  path: string | ((params: never) => string),
  params: Readonly<Record<string, unknown>>,
): string {
  const bruto = typeof path === 'function' ? path(params as never) : path;
  return bruto.replace(/:([A-Za-z0-9_]+)/g, (original, chave: string) => {
    const valor = params[chave];
    return valor === undefined ? original : encodeURIComponent(String(valor));
  });
}
