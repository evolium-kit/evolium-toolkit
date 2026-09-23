import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { authPlugin, EvoAuthApi, EvoSessionDto, toSession } from '../plugins/auth';
import { evoDispatchInterceptor } from './http/dispatch.interceptor';
import { endpoint } from './http/endpoint';
import { provideEvoServices, withBaseUrl, withPlugin } from './provide-evo-services';
import { EvoResourceRegistry } from './registry';
import { EVO_STORAGE } from './tokens';
import { EvoPlugin } from './types';

const BASE = 'https://api.teste';

/* ------------------------------------------------------------------------- */
/* Plugin de OAuth: acrescenta métodos ao `auth` sem lhe tocar numa linha.     */
/* ------------------------------------------------------------------------- */

interface OAuthExtension {
  handleCallback(code: string, state: string): Promise<void>;
}

/**
 * Aumenta a interface de extensão do plugin de auth, e **não** o
 * `EvoResourceMap`: redeclarar `auth` ali colidiria com a declaração do próprio
 * plugin, porque o declaration merging não permite redefinir uma propriedade
 * existente. Ver `EvoAuthExtensions`.
 */
declare module '../plugins/auth/auth.plugin' {
  interface EvoAuthExtensions extends OAuthExtension {}
}

const oauthEndpoints = {
  exchange: endpoint<{ code: string; state: string }, ReturnType<typeof toSession>>({
    method: 'POST',
    path: '/auth/oauth/exchange',
    anonymous: true,
    mapResponse: (dto) => toSession(dto as EvoSessionDto),
  }),
} as const;

function oauthPlugin(): EvoPlugin<Record<string, never>> {
  return {
    name: 'oauth',
    dependsOn: ['auth'],

    setup: () => ({}) as Record<string, never>,

    // Corre depois de TODOS os setup(), que é o único momento em que se pode
    // assumir que o resource 'auth' já existe.
    augment(ctx) {
      const auth = ctx.resolve('auth');
      const client = ctx.http.client(oauthEndpoints);

      const extensao: OAuthExtension = {
        async handleCallback(code, state) {
          if (ctx.storage.get('oauth-state') !== state) {
            throw ctx.toError(new Error('OAuth state inválido'));
          }
          // adoptSession é o ponto de extensão público do plugin de auth.
          auth.adoptSession(await client.exchange({ code, state }));
        },
      };

      Object.assign(auth, extensao);
    },
  };
}

/* ------------------------------------------------------------------------- */

describe('extensão de um plugin por outro', () => {
  let http: HttpTestingController;
  let registry: EvoResourceRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([evoDispatchInterceptor])),
        provideHttpClientTesting(),
        provideEvoServices(
          withBaseUrl(BASE),
          // Ordem invertida de propósito: quem depende vem primeiro.
          withPlugin(oauthPlugin()),
          withPlugin(authPlugin()),
        ),
      ],
    });
    registry = TestBed.inject(EvoResourceRegistry);
    http = TestBed.inject(HttpTestingController);
  });

  it('inicializa na ordem topológica, e não na de declaração', () => {
    expect(registry.names()).toEqual(['auth', 'oauth']);
  });

  it('acrescenta métodos ao resource existente', () => {
    expect(typeof registry.get('auth').handleCallback).toBe('function');
  });

  it('preserva a API original do plugin estendido', () => {
    const auth = registry.get('auth');
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.logout).toBe('function');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('rejeita um state que não coincida', async () => {
    const auth = registry.get('auth');
    TestBed.inject(EVO_STORAGE).set('oauth-state', 'state-correcto');

    await expect(auth.handleCallback!('codigo', 'state-errado')).rejects.toThrow(/state inválido/);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('estabelece a sessão através do ponto de extensão público do auth', async () => {
    const auth = registry.get('auth');
    TestBed.inject(EVO_STORAGE).set('oauth-state', 'state-correcto');

    const promessa = auth.handleCallback!('codigo', 'state-correcto');

    http.expectOne(`${BASE}/auth/oauth/exchange`).flush({
      access_token: 'token-oauth',
      expires_in: 3600,
      user: { id: 'u2', email: 'joao@evolium.ao', full_name: 'João Neto', roles: ['user'] },
    });

    await promessa;

    // O auth nunca soube do OAuth: só expôs adoptSession.
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()?.name).toBe('João Neto');
    expect(auth.accessToken()).toBe('token-oauth');
  });

  it('não regista um resource para um plugin que só estende outros', () => {
    // O oauth existe como plugin, mas a sua API é vazia: tudo o que faz
    // é acrescentado ao auth.
    expect(Object.keys(registry.get('oauth' as 'auth'))).toEqual([]);
    http.verify();
  });
});
