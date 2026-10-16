import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { CrudKitPlugin } from './crud-kit-plugin.types';

/**
 * Estilo `HTTP_INTERCEPTORS`: cada provider regista UM plugin com `multi: true`, o
 * Angular agrega tudo num array. Sem nenhum `provideCrudKitPlugins()` na app,
 * `inject(CRUD_KIT_GLOBAL_PLUGINS, { optional: true })` devolve `null`.
 */
export const CRUD_KIT_GLOBAL_PLUGINS = new InjectionToken<CrudKitPlugin[]>('CRUD_KIT_GLOBAL_PLUGINS');

/**
 * Regista plugins globais, aplicados a TODOS os `createCrudResource`/`createCrudController`
 * da aplicação. Recebe FÁBRICAS (`() => CrudKitPlugin`), não instâncias — isto é
 * obrigatório porque `app.config.ts` corre fora de qualquer contexto de injeção do
 * Angular, e plugins que fazem `inject(AlertModalService)` (ou qualquer outro serviço) só
 * podem ser construídos dentro desse contexto. Com `useFactory`, a construção real só
 * acontece quando o Angular resolve o token — isto é, quando `createCrudResource` faz
 * `inject(CRUD_KIT_GLOBAL_PLUGINS)`, já dentro de um contexto de injeção válido.
 *
 * @example
 * providers: [
 *   provideCrudKitPlugins(
 *     () => pluginToastAutomatico(),
 *     () => pluginInvalidarRelacionados('dashboard-stats'),
 *   ),
 * ],
 */
export function provideCrudKitPlugins(...fabricas: Array<() => CrudKitPlugin>): EnvironmentProviders {
  return makeEnvironmentProviders(
    fabricas.map((fabrica) => ({
      provide: CRUD_KIT_GLOBAL_PLUGINS,
      useFactory: fabrica,
      multi: true,
    })),
  );
}
