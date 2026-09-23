# @evolium-kit/toolkit/services

Kernel de serviços **totalmente baseado em plugins**.

O kernel não conhece `auth`, nem `users`, nem nenhum resource em concreto. Só
sabe três coisas: correr o `setup()` de cada plugin por ordem de dependências,
guardar o que esse `setup()` devolve, e entregar a cada plugin um contexto. O
plugin de autenticação é apenas o primeiro consumidor dessa API — não é um caso
especial, e não tem uma única linha de código privilegiado no kernel.

---

## Parte 1 — Usar

### Configuração

```ts
// app.config.ts
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  authPlugin,
  cookieStorage,
  evoDispatchInterceptor,
  provideEvoServices,
  withBaseUrl,
  withPlugin,
  withStorage,
} from '@evolium-kit/toolkit/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    // evoDispatchInterceptor é obrigatório: é ele que encaminha cada pedido
    // para a cadeia de interceptors do plugin que o originou.
    provideHttpClient(withFetch(), withInterceptors([evoDispatchInterceptor])),

    provideEvoServices(
      withBaseUrl('https://api.evolium.ao'),
      withStorage(cookieStorage({ prefix: 'evo_' })),
      withPlugin(authPlugin(), { refreshSkewSeconds: 60 }),
    ),
  ],
};
```

### Consumir um resource

Duas formas, ambas com tipos completos e a devolver o mesmo objecto:

```ts
import { Component, inject, signal } from '@angular/core';
import { EvoAuth, EvoError, EvoResourceRegistry } from '@evolium-kit/toolkit/services';

@Component({/* … */})
export class LoginPage {
  // Forma 1 — token dedicado do plugin.
  private readonly auth = inject(EvoAuth);

  // Forma 2 — registry genérico. 'auth' é validado contra EvoResourceMap:
  // registry.get('facturas') não compila enquanto esse plugin não for importado.
  private readonly registry = inject(EvoResourceRegistry);

  protected readonly erro = signal<string | null>(null);
  protected readonly aEntrar = signal(false);

  async entrar(email: string, password: string): Promise<void> {
    this.aEntrar.set(true);
    this.erro.set(null);
    try {
      await this.auth.login({ email, password });
    } catch (e) {
      // Nunca chega aqui um HttpErrorResponse cru — é sempre um EvoError.
      const erro = e as EvoError;
      this.erro.set(
        erro.kind === 'unauthorized' ? 'Credenciais inválidas.' : 'Não foi possível entrar.',
      );
    } finally {
      this.aEntrar.set(false);
    }
  }
}
```

Estado reactivo exposto pelo plugin de auth:

```ts
auth.currentUser(); // Signal<EvoUser | null>
auth.isAuthenticated(); // Signal<boolean>
auth.roles(); // Signal<readonly string[]>
```

### Guards

```ts
import { evoAuthGuard, evoRoleGuard } from '@evolium-kit/toolkit/services';

export const routes: Routes = [
  { path: 'painel', loadComponent: …, canActivate: [evoAuthGuard] },
  { path: 'admin', loadComponent: …, canActivate: [evoRoleGuard('admin', 'gestor')] },
];
```

---

## Parte 2 — Escrever um plugin novo

### A lei fundamental

**O kernel não pode ganhar casos especiais.** Se for preciso alterar
`src/lib/kernel/` para acrescentar um resource, uma de duas: falta um ponto de
extensão _genérico_ — e isso é uma decisão de arquitectura a discutir antes de
implementar — ou o plugin está mal desenhado. Não há atalhos.

### Preferir o gerador

```bash
ng g @evolium-kit/toolkit:resource-plugin facturas --dry-run
ng g @evolium-kit/toolkit:resource-plugin facturas
```

### Ficheiros

```
services/src/lib/plugins/<nome>/
├── <nome>.models.ts       modelos de domínio E DTOs da wire, separados
├── <nome>.mappers.ts      toDomain(dto) / toDto(model)
├── <nome>.endpoints.ts    definição declarativa dos endpoints
├── <nome>.plugin.ts       o plugin: name, dependsOn, setup()
├── <nome>.token.ts        InjectionToken<Evo<Nome>Api>
├── <nome>.spec.ts         testes com HttpTestingController
└── index.ts
```

### Checklist

- [ ] **Modelos e DTOs separados.** O `snake_case` da API nunca escapa para o
      domínio. Os mappers são obrigatórios, mesmo quando hoje são triviais.
- [ ] **Endpoints declarativos**, com `anonymous: true` em tudo o que não deve
      levar o token: login, registo, recuperação de senha, e **sobretudo o
      refresh** — esquecer o refresh causa um ciclo infinito de renovação.
- [ ] **Aumentar o `EvoResourceMap`** com `declare module`. Se o plugin puder vir
      a ser estendido por outros, exportar também uma interface de extensão vazia
      e intersectá-la logo aqui — ver "Estender outro plugin".
- [ ] **Estado em `signal()`** dentro do `setup()`, exposto só como `computed()`
      ou `.asReadonly()`. **Nunca expor um `WritableSignal`** na API pública.
- [ ] **Erros sempre por `ctx.toError(e)`**.
- [ ] **SSR:** usar `ctx.storage` e `ctx.isServer`. Zero `localStorage` directo.
- [ ] Testes do caminho feliz de cada método e de pelo menos um erro mapeado.

### Esqueleto

```ts
import { computed, InjectionToken, signal } from '@angular/core';
import { endpoint, EvoPlugin, EvoPluginContext } from '@evolium-kit/toolkit/services';

export interface EvoFacturasApi {
  readonly lista: Signal<readonly Factura[]>;
  carregar(): Promise<void>;
  criar(dados: NovaFactura): Promise<Factura>;
}

export const EvoFacturas = new InjectionToken<EvoFacturasApi>('EvoFacturas');

// É isto que torna registry.get('facturas') type-safe sem o kernel saber nada.
declare module '@evolium-kit/toolkit/services' {
  interface EvoResourceMap {
    facturas: EvoFacturasApi;
  }
}

const endpoints = {
  list: endpoint<void, readonly FacturaDto[]>({ method: 'GET', path: '/facturas' }),
  create: endpoint<NovaFacturaDto, FacturaDto>({ method: 'POST', path: '/facturas' }),
} as const;

export function facturasPlugin(): EvoPlugin<EvoFacturasApi> {
  let api: EvoFacturasApi;

  return {
    name: 'facturas',
    dependsOn: ['auth'], // precisa do Bearer
    providers: [{ provide: EvoFacturas, useFactory: () => api }],

    setup(ctx: EvoPluginContext): EvoFacturasApi {
      const client = ctx.http.client(endpoints);
      const lista = signal<readonly Factura[]>([]);

      api = {
        lista: computed(() => lista()),
        async carregar() {
          const dtos = await client.list().catch((e) => {
            throw ctx.toError(e);
          });
          lista.set(dtos.map(toFactura));
        },
        async criar(dados) {
          const dto = await client.create(toDto(dados)).catch((e) => {
            throw ctx.toError(e);
          });
          const nova = toFactura(dto);
          lista.update((actual) => [...actual, nova]);
          return nova;
        },
      };

      return api;
    },
  };
}
```

### Estender outro plugin, sem fork

Use `dependsOn` mais o hook `augment()`, que corre depois de **todos** os
`setup()` — é o único momento em que se pode assumir que qualquer resource existe:

```ts
export function oauthPlugin(): EvoPlugin<Record<string, never>> {
  return {
    name: 'oauth',
    dependsOn: ['auth'],
    setup: () => ({}) as Record<string, never>,

    augment(ctx) {
      const auth = ctx.resolve('auth');
      const client = ctx.http.client(oauthEndpoints);

      Object.assign(auth, {
        async handleCallback(code: string, state: string) {
          if (ctx.storage.get('oauth-state') !== state) {
            throw ctx.toError(new Error('OAuth state inválido'));
          }
          auth.adoptSession(await client.exchange({ code, state }));
        },
      } satisfies EvoOAuthExtension);
    },
  };
}

// Aumentar a interface de EXTENSÃO do plugin, nunca o EvoResourceMap.
declare module '@evolium-kit/toolkit/services' {
  interface EvoAuthExtensions extends EvoOAuthExtension {}
}
```

> **Isto não é estilo, é obrigatório.** O declaration merging do TypeScript não
> permite redeclarar uma propriedade que já existe numa interface. Escrever
> `auth: EvoAuthApi & EvoOAuthExtension` no `EvoResourceMap` colide com a
> declaração do próprio plugin de auth e **não compila**.

Para que um plugin seja extensível são precisas duas coisas:

1. **Uma interface de extensão vazia**, exportada pelo plugin e já intersectada
   na sua entrada do `EvoResourceMap`:

   ```ts
   export interface EvoAuthExtensions {}

   declare module '../../kernel/resource-map' {
     interface EvoResourceMap {
       auth: EvoAuthApi & EvoAuthExtensions;
     }
   }
   ```

2. **Métodos públicos de entrada** — como o `adoptSession()` do auth — em vez de
   deixar o estado acessível só por dentro.

### Storage e SSR

| Estratégia                                    | SSR                                                                             | Uso                    |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| `localStorage`                                | **Não** — `window` não existe, a hidratação lê `null` e provoca um logout falso | só com aviso explícito |
| Cookie `HttpOnly`, lido via `inject(REQUEST)` | Sim                                                                             | **refresh token**      |
| Signal em memória                             | Sim, re-obtido por refresh no arranque                                          | **access token**       |

O default é `memoryStorage()` precisamente para nunca rebentar no servidor.

### Interceptors por plugin

Declarados em `interceptors: [...]` do plugin, e aplicados **só** a pedidos
feitos por `ctx.http`. O `evoDispatchInterceptor` global encaminha cada pedido
para a cadeia certa a partir do `EVO_PLUGIN_ID` no `HttpContext`.

Isto existe porque o Angular resolve os interceptors uma única vez no
`provideHttpClient` e não há API pública para acrescentar mais depois do
bootstrap. O dispatcher dá isolamento por plugin mantendo uma só linha na
configuração da aplicação.

### Armadilhas conhecidas

| Sintoma                               | Causa                             | Solução                                           |
| ------------------------------------- | --------------------------------- | ------------------------------------------------- |
| `resource "x" não registado`          | falta o plugin                    | `withPlugin(xPlugin())`                           |
| o interceptor do plugin não corre     | falta o `evoDispatchInterceptor`  | acrescentar ao `provideHttpClient`                |
| ciclo infinito de refresh             | `/auth/refresh` não é `anonymous` | `anonymous: true` no endpoint                     |
| `ctx.resolve('y')` falha em `setup()` | `y` não está em `dependsOn`       | declarar a dependência, ou mover para `augment()` |
| sessão perde-se ao hidratar           | uso de `localStorage`             | usar `ctx.storage`                                |
| `[evo] ciclo de dependências`         | `dependsOn` circular              | quebrar o ciclo com `augment()`                   |

### Antes de dar por concluído

```bash
npm run build:lib && npm run test:lib
npx prettier --write projects/toolkit/services
```

E acrescentar o plugin à secção "Usar" deste README, com um exemplo copiável.
