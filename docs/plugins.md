# O kernel de serviços, por dentro

Como o kernel de plugins funciona, porque a autenticação não é um caso
especial, e como estender um plugin sem fazer fork dele.

Para a API do dia a dia (`withPlugin`, `endpoint`, `EvoAuth`...), ver
[`services/README.md`](../projects/toolkit/services/README.md). Este
documento explica o modelo por trás dessa API — lê-o antes de criar um plugin
mais complexo do que um CRUD simples, ou antes de estender o plugin de
autenticação.

## A lei fundamental

**O kernel não conhece nenhum plugin em concreto.** Não sabe o que é `auth`,
não sabe o que é `facturas`. Sabe apenas três coisas:

1. correr o `setup()` de cada plugin registado, por ordem topológica de
   `dependsOn`;
2. guardar o que esse `setup()` devolve, indexado pelo `name` do plugin;
3. entregar a cada plugin um `EvoPluginContext` — HTTP, storage, eventos,
   resolução de outros plugins.

O plugin de autenticação (`authPlugin()`, em
`services/src/lib/plugins/auth/`) é construído exactamente sobre os mesmos
contratos que qualquer plugin que escrevas no teu projecto. Não tem acesso a
nada que um plugin de terceiros não tenha.

**Se sentires vontade de abrir `services/src/lib/kernel/` para resolver um
problema de um plugin específico, pára.** Ou falta ao kernel um ponto de
extensão genérico — que é uma decisão de arquitectura, a discutir antes de
implementar — ou o problema resolve-se do lado do plugin.

## O ciclo de vida de um plugin

```
provideEvoServices(
  withBaseUrl('/api'),
  withPlugin(authPlugin()),
  withPlugin(facturasPlugin()),   // dependsOn: ['auth']
)
```

Ao arrancar a aplicação:

1. Os plugins são ordenados topologicamente pelo `dependsOn` de cada um —
   `authPlugin` corre antes de `facturasPlugin`, porque este declara
   `dependsOn: ['auth']`. Um ciclo de dependências é detectado e lança um
   erro explícito, nomeando o caminho completo.
2. Para cada plugin, por essa ordem, o kernel constrói um `EvoPluginContext`
   e chama `plugin.setup(ctx)`. O que a função devolve fica registado no
   `EvoResourceRegistry`, sob o `name` do plugin.
3. **Só depois de todos os `setup()` terem corrido**, o kernel chama o
   `augment(ctx)` de cada plugin que o tenha. É o único momento em que um
   plugin pode assumir com segurança que qualquer outro resource já existe —
   ver [Estender um plugin sem fork](#estender-um-plugin-sem-fork).

## Consumir um resource — duas formas, um só objecto

```ts
import { inject } from '@angular/core';
import { EvoAuth, EvoResourceRegistry } from '@evolium-kit/toolkit/services';

// Forma 1 — token dedicado do plugin
const auth = inject(EvoAuth);

// Forma 2 — registry genérico, com o mesmo tipo
const registry = inject(EvoResourceRegistry);
const auth2 = registry.get('auth'); // 'auth' é validado contra o EvoResourceMap
```

`registry.get('facturas')` só compila depois de o teu plugin de facturas ter
sido importado algures na aplicação — é o `declare module` que o plugin faz
sobre o `EvoResourceMap` que ensina o TypeScript a reconhecer o nome.

## Escrever um plugin novo

Preferir sempre o gerador:

```bash
ng g @evolium-kit/toolkit:resource-plugin facturas --depends-on auth --endpoints list,get,create,update,remove
```

Isto produz, em `src/app/resources/facturas/`:

```
facturas.models.ts     modelo de domínio + DTO da wire, separados
facturas.mappers.ts     toDomain(dto) / toDto(modelo)
facturas.endpoints.ts   endpoints declarativos
facturas.plugin.ts      o plugin em si
facturas.plugin.spec.ts testes, já a registar as dependências correctas
index.ts
```

### Porque modelo e DTO são sempre ficheiros separados

O formato que a tua API usa (`total_kwanza`, `full_name`, o que for) nunca
deve escapar para o resto da aplicação. O mapper é a única fronteira — mesmo
quando hoje é uma cópia trivial campo a campo, é aqui que uma mudança futura
do backend fica contida a um único ficheiro.

### `anonymous: true` — e porque o refresh token o exige sempre

```ts
export const authEndpoints = {
  login: endpoint<EvoCredentials, EvoSession>({
    method: 'POST',
    path: '/auth/login',
    anonymous: true, // não leva o Bearer
    mapResponse: (dto) => toSession(dto as EvoSessionDto),
  }),
  refreshToken: endpoint<void, EvoSession>({
    method: 'POST',
    path: '/auth/refresh',
    anonymous: true, // OBRIGATÓRIO — ver abaixo
  }),
};
```

Um endpoint marcado `anonymous` não passa pelos interceptors partilhados
(nomeadamente o que acrescenta o Bearer). O `refreshToken` **tem** de ser
`anonymous`: se levasse o Bearer, um token expirado provocaria um 401, que
dispara uma tentativa de renovação, que usa o mesmo token expirado, que
provoca outro 401 — um ciclo infinito. Marcá-lo `anonymous` quebra esse ciclo
à partida.

## `interceptors` vs `sharedInterceptors` — a distinção que evita um bug real

Isto já causou um bug real durante o desenvolvimento da toolkit, por isso
vale a pena perceber bem:

- **`interceptors`** — corre só em pedidos feitos pelo `ctx.http` **do
  próprio plugin**. Serve lógica interna: paginação própria, um cabeçalho
  específico de um serviço.
- **`sharedInterceptors`** — corre em pedidos de **todos** os plugins. É o
  que a autenticação precisa: o Bearer tem de ir também nos pedidos que o
  plugin de facturas faz, não só nos que o próprio `authPlugin` faz.

```ts
// auth.plugin.ts
return {
  name: 'auth',
  sharedInterceptors: [authBearerInterceptor], // não `interceptors`
  // …
};
```

Se o Bearer estivesse em `interceptors`, o plugin de facturas — que é
precisamente quem mais precisa do token — faria todos os pedidos sem
`Authorization`, e a API responderia sempre 401. O sintoma só aparece a
correr a aplicação a sério; um teste que só registe o `authPlugin()` sozinho
não o apanha.

## Estender um plugin sem fork

O plugin de autenticação expõe `adoptSession()` como ponto de extensão
público — é assim que um plugin de OAuth conclui o seu fluxo sem tocar no
código do `authPlugin`:

```ts
export function oauthPlugin(): EvoPlugin<Record<string, never>> {
  return {
    name: 'oauth',
    dependsOn: ['auth'],
    setup: () => ({}) as Record<string, never>,

    // Corre depois de TODOS os setup() — só aqui 'auth' existe garantidamente.
    augment(ctx) {
      const auth = ctx.resolve('auth');
      const client = ctx.http.client(oauthEndpoints);

      Object.assign(auth, {
        async handleCallback(code: string, state: string) {
          const sessao = await client.exchange({ code, state });
          auth.adoptSession(sessao); // o ponto de extensão público
        },
      } satisfies EvoOAuthExtension);
    },
  };
}
```

### A armadilha do declaration merging — e como a evitar

O TypeScript **não permite redeclarar uma propriedade que já existe** numa
interface. Escrever isto directamente **não compila**:

```ts
// ERRADO — colide com a declaração do próprio authPlugin
declare module '@evolium-kit/toolkit/services' {
  interface EvoResourceMap {
    auth: EvoAuthApi & EvoOAuthExtension;
  }
}
```

A solução: todo o plugin que possa vir a ser estendido exporta uma interface
de extensão **vazia**, já intersectada na sua própria entrada do
`EvoResourceMap`:

```ts
// dentro do próprio auth.plugin.ts
export interface EvoAuthExtensions {}

declare module '../../kernel/resource-map' {
  interface EvoResourceMap {
    auth: EvoAuthApi & EvoAuthExtensions;
  }
}
```

E quem estende aumenta essa interface, não o `EvoResourceMap`:

```ts
// no plugin de OAuth
declare module '@evolium-kit/toolkit/services' {
  interface EvoAuthExtensions extends EvoOAuthExtension {}
}
```

**Regra prática:** qualquer plugin teu que outra pessoa possa querer estender
mais tarde deve nascer já com uma `<Nome>Extensions` vazia, pelo mesmo motivo.
O gerador `resource-plugin` já faz isto por omissão.

## Storage — a escolha errada causa um "logout falso" na hidratação

| Estratégia                                | Funciona em SSR?                             | Uso recomendado            |
| ----------------------------------------- | -------------------------------------------- | -------------------------- |
| `localStorage`                            | **Não** — `window` não existe no servidor    | nunca para dados de sessão |
| Cookie, via `inject(REQUEST)` no servidor | Sim                                          | **refresh token**          |
| `signal()` em memória                     | Sim (obtido de novo por refresh no arranque) | **access token**           |

Se o refresh token vivesse em `localStorage`, o servidor renderizaria sempre
como se não houvesse sessão (porque `localStorage` não existe aí), e o
cliente corrigiria isso só depois da hidratação — um "pisca" visível de
utilizador desligado. Por isso o `ctx.storage` da toolkit é a abstracção a
usar sempre, nunca `localStorage` directamente dentro de um plugin.

## Erros — nunca deixar passar um `HttpErrorResponse` cru

```ts
async carregar() {
  const dados = await client.list().catch((erro: unknown) => {
    throw ctx.toError(erro);   // sempre, em todos os métodos
  });
}
```

`ctx.toError()` aplica primeiro o `mapError` do próprio plugin (se existir), e
cai depois no mapeador global, que converte qualquer erro num `EvoError` com
uma `kind` estável (`'unauthorized'`, `'validation'`, `'server'`...). O
consumidor de um resource nunca deve precisar de saber se o erro veio de uma
resposta HTTP, de uma falha de rede, ou de outra coisa qualquer.

## Checklist antes de dar um plugin por terminado

- [ ] Modelo de domínio e DTO em ficheiros separados, com mapper entre eles
- [ ] `anonymous: true` em tudo o que deva funcionar sem sessão — e sempre no
      refresh, se o plugin gerir tokens
- [ ] `dependsOn` declara todas as dependências reais
- [ ] `sharedInterceptors` (não `interceptors`) para qualquer coisa que deva
      afectar pedidos de outros plugins
- [ ] Estado interno em `signal()`, exposto só como `computed()` ou
      `.asReadonly()` — nunca um `WritableSignal` na API pública
- [ ] Todos os erros passam por `ctx.toError(e)`
- [ ] Nada de `localStorage` directo — sempre `ctx.storage`
- [ ] Se o plugin puder ser estendido, exporta uma `<Nome>Extensions` vazia
- [ ] Testes cobrem o caminho feliz de cada método e pelo menos um erro

## Ver também

- [`services/README.md`](../projects/toolkit/services/README.md) — API
  completa e mais exemplos
- [`architecture.md`](architecture.md) — porque o kernel está isolado das
  outras camadas
