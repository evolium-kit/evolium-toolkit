import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { EVO_PLUGIN_ID, EVO_PLUGINS } from '../tokens';

/**
 * Encaminha cada pedido para a cadeia de interceptors do plugin que o originou.
 *
 * É preciso registá-lo uma vez na aplicação:
 *
 * ```ts
 * provideHttpClient(withFetch(), withInterceptors([evoDispatchInterceptor]))
 * ```
 *
 * Existe porque o Angular resolve os interceptors uma única vez, ao construir o
 * `HttpClient`, e não há API pública para acrescentar mais depois do bootstrap.
 * Sem este dispatcher, ou cada plugin exigiria uma entrada própria na
 * configuração da aplicação — o que quebraria o registo dinâmico — ou os
 * interceptors de um plugin veriam os pedidos de todos os outros.
 */
export const evoDispatchInterceptor: HttpInterceptorFn = (req, next) => {
  const pluginId = req.context.get(EVO_PLUGIN_ID);
  // Sem id: ou é um pedido anónimo do kernel, ou nem sequer veio de um plugin.
  if (!pluginId) return next(req);

  const plugins = inject(EVO_PLUGINS, { optional: true }) ?? [];

  const cadeia = [
    // Partilhados primeiro, ficando na posição mais exterior: o Bearer é
    // acrescentado antes de qualquer lógica específica do plugin de destino,
    // e a renovação em 401 vê a resposta depois dela.
    ...plugins.flatMap((plugin) => plugin.sharedInterceptors ?? []),
    ...(plugins.find((plugin) => plugin.name === pluginId)?.interceptors ?? []),
  ];

  if (cadeia.length === 0) return next(req);

  // Composição da direita para a esquerda, como o Angular faz internamente:
  // o primeiro interceptor da lista é o mais exterior.
  const handler = cadeia.reduceRight<HttpHandlerFn>(
    (seguinte, interceptor) => (pedido: HttpRequest<unknown>) => interceptor(pedido, seguinte),
    next,
  );

  return handler(req);
};
