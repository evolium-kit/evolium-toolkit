import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InjectionToken, Signal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { authPlugin } from '../plugins/auth';
import { evoDispatchInterceptor } from './http/dispatch.interceptor';
import { endpoint } from './http/endpoint';
import { provideEvoServices, withBaseUrl, withPlugin } from './provide-evo-services';
import { EvoResourceRegistry } from './registry';
import { EvoPlugin, EvoPluginContext } from './types';

const BASE_TESTE = 'https://api.teste';

/* ------------------------------------------------------------------------- */
/* Um plugin totalmente de fora: nenhuma linha do kernel o conhece.           */
/* ------------------------------------------------------------------------- */

interface FacturaDto {
  readonly id: string;
  readonly total_kwanza: number;
}

interface Factura {
  readonly id: string;
  readonly total: number;
}

interface FacturasApi {
  readonly lista: Signal<readonly Factura[]>;
  carregar(): Promise<void>;
  obter(params: { id: string }): Promise<Factura>;
}

const Facturas = new InjectionToken<FacturasApi>('Facturas');

// O declaration merging que torna registry.get('facturas') type-safe.
declare module './resource-map' {
  interface EvoResourceMap {
    facturas: FacturasApi;
  }
}

const toFactura = (dto: FacturaDto): Factura => ({ id: dto.id, total: dto.total_kwanza });

const facturasEndpoints = {
  list: endpoint<void, readonly Factura[]>({
    method: 'GET',
    path: '/facturas',
    mapResponse: (dto) => (dto as readonly FacturaDto[]).map(toFactura),
  }),
  get: endpoint<void, Factura, { id: string }>({
    method: 'GET',
    path: '/facturas/:id',
    mapResponse: (dto) => toFactura(dto as FacturaDto),
  }),
} as const;

function facturasPlugin(): EvoPlugin<FacturasApi> {
  let api: FacturasApi;

  return {
    name: 'facturas',
    providers: [{ provide: Facturas, useFactory: () => api }],

    setup(ctx: EvoPluginContext): FacturasApi {
      const client = ctx.http.client(facturasEndpoints);
      const interna = signal<readonly Factura[]>([]);

      api = {
        lista: computed(() => interna()),
        async carregar() {
          interna.set(await client.list());
        },
        obter: (params) => client.get(params),
      };

      return api;
    },
  };
}

/* ------------------------------------------------------------------------- */

describe('kernel de plugins', () => {
  let http: HttpTestingController;
  let registry: EvoResourceRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([evoDispatchInterceptor])),
        provideHttpClientTesting(),
        provideEvoServices(withBaseUrl(BASE_TESTE), withPlugin(facturasPlugin())),
      ],
    });

    // Injectar o registry força o arranque dos inicializadores de ambiente.
    registry = TestBed.inject(EvoResourceRegistry);
    http = TestBed.inject(HttpTestingController);
  });

  it('regista um plugin externo sem qualquer alteração ao kernel', () => {
    expect(registry.has('facturas')).toBe(true);
    expect(registry.names()).toContain('facturas');
  });

  it('expõe a mesma API pelo registry e pelo token do plugin', () => {
    expect(registry.get('facturas')).toBe(TestBed.inject(Facturas));
  });

  it('constrói a URL a partir do baseUrl e aplica o mapeamento de DTO', async () => {
    const api = registry.get('facturas');
    const promessa = api.carregar();

    const pedido = http.expectOne(`${BASE_TESTE}/facturas`);
    expect(pedido.request.method).toBe('GET');
    pedido.flush([{ id: 'f1', total_kwanza: 5000 }]);

    await promessa;

    // O snake_case ficou na fronteira: o domínio só vê `total`.
    expect(api.lista()).toEqual([{ id: 'f1', total: 5000 }]);
  });

  it('substitui parâmetros no caminho', async () => {
    const promessa = registry.get('facturas').obter({ id: 'f9' });
    http.expectOne(`${BASE_TESTE}/facturas/f9`).flush({ id: 'f9', total_kwanza: 1 });
    await expect(promessa).resolves.toEqual({ id: 'f9', total: 1 });
  });

  it('explica o que falta quando o resource não existe', () => {
    expect(() => registry.get('inexistente' as 'facturas')).toThrow(/withPlugin/);
  });
});

/**
 * Regressão de um bug de desenho.
 *
 * O `authBearerInterceptor` estava em `interceptors`, que só se aplicam a
 * pedidos do próprio plugin. Consequência: qualquer outro plugin — que é
 * precisamente quem mais precisa do token — fazia pedidos sem `Authorization` e
 * recebia 401. Daí a distinção entre `interceptors` e `sharedInterceptors`.
 */
describe('interceptors partilhados entre plugins', () => {
  let http: HttpTestingController;
  let registry: EvoResourceRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([evoDispatchInterceptor])),
        provideHttpClientTesting(),
        provideEvoServices(
          withBaseUrl(BASE_TESTE),
          withPlugin(authPlugin()),
          withPlugin(facturasPlugin()),
        ),
      ],
    });
    registry = TestBed.inject(EvoResourceRegistry);
    http = TestBed.inject(HttpTestingController);
  });

  it('o pedido de um plugin sem interceptors próprios leva o Bearer do auth', async () => {
    const auth = registry.get('auth');

    const login = auth.login({ email: 'ana@evolium.ao', password: 'x' });
    http.expectOne(`${BASE_TESTE}/auth/login`).flush({
      access_token: 'token-partilhado',
      expires_in: 3600,
      user: { id: 'u1', email: 'ana@evolium.ao', full_name: 'Ana', roles: [] },
    });
    await login;

    // Pedido originado pelo plugin `facturas`, que não declara interceptors.
    const carregar = registry.get('facturas').carregar();
    const pedido = http.expectOne(`${BASE_TESTE}/facturas`);

    expect(pedido.request.headers.get('Authorization')).toBe('Bearer token-partilhado');

    pedido.flush([]);
    await carregar;
  });

  it('não leva Bearer nenhum antes de haver sessão', async () => {
    const carregar = registry
      .get('facturas')
      .carregar()
      .catch(() => undefined);
    const pedido = http.expectOne(`${BASE_TESTE}/facturas`);
    expect(pedido.request.headers.has('Authorization')).toBe(false);
    pedido.flush([]);
    await carregar;
  });
});
