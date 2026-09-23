import { HttpClient, HttpContext } from '@angular/common/http';
import { Injector, Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EVO_PLUGIN_ID } from '../tokens';
import { EvoClient, EvoEndpoint, EvoEndpointMap, resolvePath } from './endpoint';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cliente HTTP de um plugin.
 *
 * Cada instância conhece o id do plugin que a criou e marca todos os pedidos
 * com ele, o que activa a cadeia de interceptors desse plugin — e apenas dela.
 */
export class EvoHttp {
  constructor(
    private readonly injector: Injector,
    private readonly baseUrl: Signal<string>,
    private readonly pluginId: string,
  ) {}

  /** Constrói um cliente tipado a partir de um mapa declarativo de endpoints. */
  client<M extends EvoEndpointMap>(endpoints: M): EvoClient<M> {
    const http = this.injector.get(HttpClient);
    const resultado: Record<string, unknown> = {};

    for (const nome of Object.keys(endpoints)) {
      const definicao = endpoints[nome] as EvoEndpoint<any, any, any>;

      resultado[nome] = async (a?: unknown, b?: unknown): Promise<unknown> => {
        const levaCorpo = definicao.method !== 'GET' && definicao.method !== 'DELETE';
        const corpo = levaCorpo ? a : undefined;
        const params = (levaCorpo ? b : a) as Record<string, unknown> | undefined;

        const caminho = resolvePath(definicao.path, params ?? {});
        const url = `${this.baseUrl().replace(/\/$/, '')}${caminho}`;

        const contexto = new HttpContext().set(
          EVO_PLUGIN_ID,
          definicao.anonymous ? null : this.pluginId,
        );

        const payload =
          definicao.mapRequest && corpo !== undefined ? definicao.mapRequest(corpo) : corpo;

        const dto = await firstValueFrom(
          http.request<unknown>(definicao.method, url, {
            body: payload,
            context: contexto,
            headers: definicao.headers,
          }),
        );

        return definicao.mapResponse ? definicao.mapResponse(dto) : dto;
      };
    }

    return resultado as EvoClient<M>;
  }
}
