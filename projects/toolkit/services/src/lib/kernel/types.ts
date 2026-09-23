import { HttpInterceptorFn } from '@angular/common/http';
import { EnvironmentProviders, Injector, Provider, Signal } from '@angular/core';
import type { Routes } from '@angular/router';
import { EvoError } from './evo-error';
import { EvoHttp } from './http/evo-http';
import { EvoResourceMap } from './resource-map';

/** Armazenamento de pares chave/valor, com implementação distinta por plataforma. */
export interface EvoStorage {
  get(key: string): string | null;
  set(key: string, value: string, options?: { maxAgeSeconds?: number }): void;
  remove(key: string): void;
}

/** Barramento de eventos entre plugins, para acoplamento fraco. */
export interface EvoEventBus {
  emit(type: string, payload: unknown): void;
  on(type: string, handler: (payload: unknown) => void): () => void;
}

/**
 * Tudo o que o kernel entrega a um plugin em `setup()` e `augment()`.
 *
 * Um plugin não injecta `HttpClient` nem lê `localStorage` directamente: usa o
 * contexto. É isso que mantém os plugins testáveis e SSR-safe por construção.
 */
export interface EvoPluginContext {
  /** URL base reactiva — pode mudar em runtime, por exemplo em multi-tenant. */
  readonly baseUrl: Signal<string>;
  /** Cliente HTTP já marcado com o id deste plugin, o que activa os seus interceptors. */
  readonly http: EvoHttp;
  readonly storage: EvoStorage;
  readonly events: EvoEventBus;
  readonly injector: Injector;
  /** `true` durante o render no servidor. */
  readonly isServer: boolean;
  /** Config passada em `withPlugin(plugin, config)`. */
  readonly config: unknown;
  /**
   * Resolve outro resource já registado. Só os plugins declarados em `dependsOn`
   * são garantidamente resolvíveis dentro de `setup()`; em `augment()` todos são.
   */
  resolve<K extends keyof EvoResourceMap>(name: K): EvoResourceMap[K];
  /** Normaliza qualquer erro, aplicando primeiro o `mapError` do plugin. */
  toError(error: unknown): EvoError;
}

/**
 * Contrato de um plugin.
 *
 * O kernel não conhece nenhum plugin em concreto: o de autenticação é apenas o
 * primeiro consumidor desta interface. Se for preciso alterar o kernel para
 * acrescentar um resource, ou falta um ponto de extensão genérico, ou o plugin
 * está mal desenhado.
 */
export interface EvoPlugin<TApi extends object = object> {
  /** Chave única no `EvoResourceMap`. */
  readonly name: string;
  readonly version?: string;
  /** Plugins que têm de ser inicializados antes deste. */
  readonly dependsOn?: readonly string[];

  /**
   * Interceptors aplicados **só** a pedidos originados por este plugin.
   *
   * Para lógica interna: paginação própria, cabeçalhos de um serviço
   * específico, repetição de um endpoint em particular.
   */
  readonly interceptors?: readonly HttpInterceptorFn[];

  /**
   * Interceptors aplicados a pedidos de **todos** os plugins.
   *
   * É o que a autenticação precisa: o Bearer tem de ir em pedidos que o plugin
   * de auth nunca faz. Sem isto, um plugin de facturas receberia 401, porque os
   * interceptors do auth só veriam os pedidos do próprio auth.
   *
   * Continuam a não correr em endpoints marcados `anonymous`, que é o que evita
   * o ciclo infinito de renovação.
   */
  readonly sharedInterceptors?: readonly HttpInterceptorFn[];

  /** Providers extra no root injector — tipicamente um `InjectionToken` tipado. */
  readonly providers?: readonly (Provider | EnvironmentProviders)[];

  /** Rotas contribuídas pelo plugin, compostas por `evoRoutes()`. */
  readonly routes?: () => Routes;

  /** Mapeamento de erro próprio. Devolver `undefined` delega ao mapper global. */
  readonly mapError?: (error: unknown) => EvoError | undefined;

  /**
   * Estende resources de outros plugins. Corre depois de **todos** os `setup()`,
   * que é o único momento em que se pode assumir que qualquer resource existe.
   */
  readonly augment?: (context: EvoPluginContext) => void;

  /** Cria a API pública do plugin. Corre dentro de `runInInjectionContext`. */
  setup(context: EvoPluginContext): TApi;
}
