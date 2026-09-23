import { HttpContextToken } from '@angular/common/http';
import { InjectionToken, Signal } from '@angular/core';
import { EvoError } from './evo-error';
import { EvoPlugin, EvoStorage } from './types';

/** Plugins registados por `withPlugin()`. */
export const EVO_PLUGINS = new InjectionToken<readonly EvoPlugin[]>('EVO_PLUGINS');

/** URL base reactiva. Um signal para permitir troca de inquilino em runtime. */
export const EVO_BASE_URL = new InjectionToken<Signal<string>>('EVO_BASE_URL');

/** Normalizador de erros global, usado quando o plugin não tem o seu. */
export const EVO_ERROR_MAPPER = new InjectionToken<(erro: unknown) => EvoError>('EVO_ERROR_MAPPER');

export const EVO_STORAGE = new InjectionToken<EvoStorage>('EVO_STORAGE');

/**
 * Par `[nomeDoPlugin, config]`, registado com `multi: true`.
 *
 * Um token multi em vez de um mapa único porque cada `withPlugin()` contribui
 * a sua própria entrada; um provider único faria a última chamada apagar as
 * configurações de todas as anteriores.
 */
export const EVO_PLUGIN_CONFIG_ENTRY = new InjectionToken<readonly (readonly [string, unknown])[]>(
  'EVO_PLUGIN_CONFIG_ENTRY',
);

/**
 * Marca um `HttpRequest` como pertencente a um plugin.
 *
 * Lido pelo `evoDispatchInterceptor`, que encaminha o pedido para a cadeia de
 * interceptors desse plugin.
 */
export const EVO_PLUGIN_ID = new HttpContextToken<string | null>(() => null);
