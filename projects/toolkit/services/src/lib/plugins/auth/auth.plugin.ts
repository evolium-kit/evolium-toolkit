import { InjectionToken, Signal, computed, signal } from '@angular/core';
import { EvoPlugin, EvoPluginContext } from '../../kernel/types';
import { authBearerInterceptor } from './auth.interceptor';
import { authEndpoints } from './auth.endpoints';
import { EvoCredentials, EvoRegisterPayload, EvoSession, EvoUser } from './auth.models';

export interface EvoAuthConfig {
  /** Margem, em segundos, para considerar o token expirado antes do tempo. */
  readonly refreshSkewSeconds?: number;
}

export interface EvoAuthApi {
  readonly currentUser: Signal<EvoUser | null>;
  readonly isAuthenticated: Signal<boolean>;
  readonly roles: Signal<readonly string[]>;
  accessToken(): string | null;

  login(credenciais: EvoCredentials): Promise<EvoUser>;
  register(dados: EvoRegisterPayload): Promise<EvoUser>;
  recoverPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  refreshToken(): Promise<EvoUser | null>;
  logout(): Promise<void>;

  /**
   * Adopta uma sessão obtida por outro meio.
   *
   * É o ponto de extensão público do plugin: é assim que um plugin de OAuth
   * conclui o seu fluxo sem precisar de fork nem de acesso ao estado interno.
   */
  adoptSession(sessao: EvoSession): void;
}

/** Token dedicado, para quem prefere `inject(EvoAuth)` ao registry genérico. */
export const EvoAuth = new InjectionToken<EvoAuthApi>('EvoAuth');

/**
 * Ponto de extensão de tipos deste plugin. Nasce vazia de propósito.
 *
 * Um plugin que acrescente métodos ao `auth` — OAuth, MFA, personificação —
 * aumenta **esta** interface, e não o `EvoResourceMap`:
 *
 * ```ts
 * declare module '@evolium-kit/toolkit/services' {
 *   interface EvoAuthExtensions {
 *     loginWithProvider(provider: 'google'): Promise<void>;
 *   }
 * }
 * ```
 *
 * A indirecção é necessária, não decorativa: o declaration merging **não**
 * permite redeclarar uma propriedade que já existe numa interface. Tentar
 * escrever `auth: EvoAuthApi & MinhaExtensao` no `EvoResourceMap` colide com a
 * declaração abaixo e não compila. Todo o plugin que queira ser extensível deve
 * expor uma interface como esta.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EvoAuthExtensions {}

/** Torna `registry.get('auth')` type-safe sem que o kernel importe este ficheiro. */
declare module '../../kernel/resource-map' {
  interface EvoResourceMap {
    auth: EvoAuthApi & EvoAuthExtensions;
  }
}

const CHAVE_SESSAO = 'has-session';

/**
 * Autenticação.
 *
 * Não tem estatuto especial no kernel: usa exactamente os mesmos contratos que
 * qualquer plugin de terceiros. Se algum dia precisar de mais do que isto, é
 * sinal de que falta um ponto de extensão genérico ao kernel.
 */
export function authPlugin(): EvoPlugin<EvoAuthApi> {
  // Preenchido em setup(); o provider de EvoAuth lê-o por fábrica, que só é
  // executada quando alguém injecta o token — sempre depois do bootstrap.
  let api: EvoAuthApi;

  return {
    name: 'auth',
    version: '1.0.0',
    // Partilhado, e não `interceptors`: o Bearer tem de ir também nos pedidos
    // que outros plugins fazem — é esse o ponto de ter autenticação central.
    sharedInterceptors: [authBearerInterceptor],
    providers: [{ provide: EvoAuth, useFactory: () => api }],

    // Sem `routes`. As páginas de /auth/* vivem em @evolium-kit/toolkit/pages, que
    // por sua vez importa este entry point para consumir o resource `auth` —
    // referenciá-las aqui cria uma dependência circular entre entry points, e o
    // ng-packagr recusa o build. As rotas são exportadas por `evoAuthRoutes()`
    // do lado de /pages, que é a camada de cima e pode depender desta.

    setup(ctx: EvoPluginContext): EvoAuthApi {
      const config = (ctx.config ?? {}) as EvoAuthConfig;
      const margem = (config.refreshSkewSeconds ?? 0) * 1000;
      const client = ctx.http.client(authEndpoints);

      const sessao = signal<EvoSession | null>(null);

      const adoptSession = (nova: EvoSession): void => {
        sessao.set(nova);
        // Marca que houve sessão, para o próximo arranque saber que vale a pena
        // tentar renovar em vez de pedir um 401 a frio.
        ctx.storage.set(CHAVE_SESSAO, '1');
        ctx.events.emit('auth:session', nova);
      };

      const limpar = (): void => {
        sessao.set(null);
        ctx.storage.remove(CHAVE_SESSAO);
        ctx.events.emit('auth:logout', null);
      };

      api = {
        currentUser: computed(() => sessao()?.user ?? null),

        isAuthenticated: computed(() => {
          const actual = sessao();
          return actual !== null && actual.expiresAt - margem > Date.now();
        }),

        roles: computed<readonly string[]>(() => sessao()?.user.roles ?? []),

        accessToken: () => sessao()?.accessToken ?? null,

        async login(credenciais) {
          const nova = await client.login(credenciais).catch((erro: unknown) => {
            throw ctx.toError(erro);
          });
          adoptSession(nova);
          return nova.user;
        },

        async register(dados) {
          const nova = await client.register(dados).catch((erro: unknown) => {
            throw ctx.toError(erro);
          });
          adoptSession(nova);
          return nova.user;
        },

        async recoverPassword(email) {
          await client.recoverPassword({ email }).catch((erro: unknown) => {
            throw ctx.toError(erro);
          });
        },

        async resetPassword(token, password) {
          await client.resetPassword({ token, password }).catch((erro: unknown) => {
            throw ctx.toError(erro);
          });
        },

        async refreshToken() {
          try {
            const nova = await client.refreshToken();
            adoptSession(nova);
            return nova.user;
          } catch {
            // Renovação falhada é um estado normal — sessão terminada —
            // e não um erro para mostrar ao utilizador.
            limpar();
            return null;
          }
        },

        async logout() {
          // Falhar o pedido não pode impedir o utilizador de sair localmente.
          await client.logout().catch(() => undefined);
          limpar();
        },

        adoptSession,
      };

      // Restauro: só tenta renovar se houver indício de sessão anterior.
      if (!ctx.isServer && ctx.storage.get(CHAVE_SESSAO) === '1') {
        void api.refreshToken();
      }

      return api;
    },
  };
}
