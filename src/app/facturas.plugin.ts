import { InjectionToken, Signal, computed, signal } from '@angular/core';
import { EvoPlugin, EvoPluginContext, endpoint } from '@evolium-kit/toolkit/services';

/**
 * Plugin de exemplo, escrito **fora** da toolkit.
 *
 * Prova o requisito central do módulo de serviços: acrescentar um resource novo
 * não exige uma única alteração ao kernel. Este ficheiro só importa contratos
 * públicos — `EvoPlugin`, `EvoPluginContext`, `endpoint` — e nada mais.
 */

/* ------------------------------------------------------------------ domínio */

export type EstadoFactura = 'paga' | 'pendente' | 'vencida';

export interface Factura {
  readonly id: string;
  readonly cliente: string;
  readonly total: number;
  readonly estado: EstadoFactura;
}

/** Formato da API, em snake_case. Nunca chega ao domínio. */
interface FacturaDto {
  readonly id: string;
  readonly cliente: string;
  readonly total_kwanza: number;
  readonly estado: EstadoFactura;
}

const toFactura = (dto: FacturaDto): Factura => ({
  id: dto.id,
  cliente: dto.cliente,
  total: dto.total_kwanza,
  estado: dto.estado,
});

/* ---------------------------------------------------------------------- API */

export interface FacturasApi {
  readonly lista: Signal<readonly Factura[]>;
  readonly total: Signal<number>;
  carregar(): Promise<void>;
}

export const Facturas = new InjectionToken<FacturasApi>('Facturas');

declare module '@evolium-kit/toolkit/services' {
  interface EvoResourceMap {
    facturas: FacturasApi;
  }
}

/* ------------------------------------------------------------------ plugin */

const endpoints = {
  list: endpoint<void, readonly Factura[]>({
    method: 'GET',
    path: '/facturas',
    mapResponse: (dto) => (dto as readonly FacturaDto[]).map(toFactura),
  }),
} as const;

export function facturasPlugin(): EvoPlugin<FacturasApi> {
  let api: FacturasApi;

  return {
    name: 'facturas',
    // Precisa do Bearer, portanto o auth tem de ser inicializado antes.
    dependsOn: ['auth'],
    providers: [{ provide: Facturas, useFactory: () => api }],

    setup(ctx: EvoPluginContext): FacturasApi {
      const client = ctx.http.client(endpoints);
      const interna = signal<readonly Factura[]>([]);

      api = {
        lista: computed(() => interna()),
        total: computed(() => interna().reduce((soma, f) => soma + f.total, 0)),
        async carregar() {
          const facturas = await client.list().catch((erro: unknown) => {
            throw ctx.toError(erro);
          });
          interna.set(facturas);
        },
      };

      return api;
    },
  };
}
