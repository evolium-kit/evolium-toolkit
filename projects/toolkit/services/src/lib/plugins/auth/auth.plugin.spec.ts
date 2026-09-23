import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoError } from '../../kernel/evo-error';
import { evoDispatchInterceptor } from '../../kernel/http/dispatch.interceptor';
import { provideEvoServices, withBaseUrl, withPlugin } from '../../kernel/provide-evo-services';
import { EvoResourceRegistry } from '../../kernel/registry';
import { EvoAuth, EvoAuthApi, authPlugin } from './auth.plugin';
import { EvoSessionDto } from './auth.models';

const BASE = 'https://api.teste';

function sessaoDto(overrides: Partial<EvoSessionDto> = {}): EvoSessionDto {
  return {
    access_token: 'token-1',
    expires_in: 3600,
    user: { id: 'u1', email: 'ana@evolium.ao', full_name: 'Ana Silva', roles: ['admin'] },
    ...overrides,
  };
}

describe('authPlugin', () => {
  let http: HttpTestingController;
  let auth: EvoAuthApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([evoDispatchInterceptor])),
        provideHttpClientTesting(),
        provideEvoServices(withBaseUrl(BASE), withPlugin(authPlugin())),
      ],
    });
    auth = TestBed.inject(EvoResourceRegistry).get('auth');
    http = TestBed.inject(HttpTestingController);
  });

  it('é um plugin como os outros, não um caso especial do kernel', () => {
    expect(TestBed.inject(EvoResourceRegistry).has('auth')).toBe(true);
    expect(TestBed.inject(EvoAuth)).toBe(auth);
  });

  it('arranca sem sessão', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.currentUser()).toBeNull();
    expect(auth.roles()).toEqual([]);
  });

  describe('login', () => {
    it('mapeia o DTO para o domínio e estabelece a sessão', async () => {
      const promessa = auth.login({ email: 'ana@evolium.ao', password: 'segredo' });

      const pedido = http.expectOne(`${BASE}/auth/login`);
      expect(pedido.request.method).toBe('POST');
      // login é anonymous: não pode levar Authorization.
      expect(pedido.request.headers.has('Authorization')).toBe(false);
      pedido.flush(sessaoDto());

      const utilizador = await promessa;

      expect(utilizador.name).toBe('Ana Silva'); // full_name -> name
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.roles()).toEqual(['admin']);
      expect(auth.accessToken()).toBe('token-1');
    });

    it('converte a falha num EvoError com categoria', async () => {
      const promessa = auth.login({ email: 'a@b.ao', password: 'errada' });
      http
        .expectOne(`${BASE}/auth/login`)
        .flush({ message: 'Credenciais inválidas.' }, { status: 401, statusText: 'Unauthorized' });

      await expect(promessa).rejects.toBeInstanceOf(EvoError);
      await promessa.catch((erro: EvoError) => {
        expect(erro.kind).toBe('unauthorized');
        expect(erro.message).toBe('Credenciais inválidas.');
      });
    });

    it('expõe erros por campo quando a API os devolve', async () => {
      const promessa = auth.register({ name: 'A', email: 'x', password: '123' });
      http
        .expectOne(`${BASE}/auth/register`)
        .flush(
          { message: 'Dados inválidos.', errors: { email: ['Formato inválido.'] } },
          { status: 422, statusText: 'Unprocessable Entity' },
        );

      await promessa.catch((erro: EvoError) => {
        expect(erro.kind).toBe('validation');
        expect(erro.fieldErrors?.['email']).toEqual(['Formato inválido.']);
      });
    });
  });

  describe('pedidos autenticados', () => {
    beforeEach(async () => {
      const promessa = auth.login({ email: 'ana@evolium.ao', password: 'x' });
      http.expectOne(`${BASE}/auth/login`).flush(sessaoDto());
      await promessa;
    });

    it('acrescenta o Bearer a pedidos não anónimos', async () => {
      const promessa = auth.logout();
      const pedido = http.expectOne(`${BASE}/auth/logout`);
      expect(pedido.request.headers.get('Authorization')).toBe('Bearer token-1');
      pedido.flush(null);
      await promessa;
    });

    it('termina a sessão mesmo se o pedido de logout falhar', async () => {
      const promessa = auth.logout();
      http.expectOne(`${BASE}/auth/logout`).error(new ProgressEvent('erro'));
      await promessa;
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('renovação', () => {
    it('não leva Bearer — é o que evita o ciclo infinito num 401', async () => {
      const promessa = auth.refreshToken();
      const pedido = http.expectOne(`${BASE}/auth/refresh`);
      expect(pedido.request.headers.has('Authorization')).toBe(false);
      pedido.flush(sessaoDto({ access_token: 'token-2' }));

      await promessa;
      expect(auth.accessToken()).toBe('token-2');
    });

    it('trata a falha como sessão terminada, e não como erro', async () => {
      const promessa = auth.refreshToken();
      http
        .expectOne(`${BASE}/auth/refresh`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      await expect(promessa).resolves.toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  it('considera expirada uma sessão cujo prazo passou', async () => {
    const promessa = auth.login({ email: 'a@b.ao', password: 'x' });
    http.expectOne(`${BASE}/auth/login`).flush(sessaoDto({ expires_in: -1 }));
    await promessa;

    expect(auth.currentUser()).not.toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
