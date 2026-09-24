# Mapa do código

O que existe, onde vive, e como os dados fluem entre as peças. Para o
_porquê_ de cada decisão, ver `docs/architecture.md` — este documento é só o
mapa; esse é a justificação.

## O pacote: um workspace, seis entry points

```
@evolium-kit/toolkit
├── /core        tipos, tokens de DI, EvoTokensDirective, EvoComponentMeta
├── /theme       EvoThemeStore, provideEvoTheme(), persistência, exportador
├── /components  EvoButton, EvoInput, EvoField, EvoCard, EvoBadge
├── /layouts     EvoAuthShell, EvoDashboardShell, EvoBlankShell
├── /pages       páginas de auth, EvoNotFoundPage, Theme Studio
└── /services    kernel de plugins, authPlugin(), guards
```

Cada entry point é uma pasta em `projects/toolkit/<nome>/` com o seu próprio
`public-api.ts`. As dependências entre eles só apontam para baixo — ver a
tabela em `docs/architecture.md`.

```
projects/toolkit/
├── core/src/lib/
│   ├── theme.model.ts          EvoThemeSnapshot, EvoTokenRecord
│   ├── theme.tokens.ts          EVO_THEME_DEFAULTS, EVO_THEME_DEFAULTS_PATCH
│   ├── token-utils.ts           normalizeTokenName, declarations() — sanitização
│   ├── component-meta.ts        EvoComponentMeta, provideEvoComponentMeta()
│   └── evo-tokens.directive.ts  [evoTokens] — override por instância/subárvore
├── theme/src/lib/
│   ├── evo-theme-store.ts       o store, signals, escreve <style id="evo-theme">
│   ├── build-theme-css.ts       função PURA, gera o CSS, valida contra XSS
│   ├── default-theme.ts         paleta flat, contrastes WCAG anotados
│   ├── provide-evo-theme.ts     provideEvoTheme(), withTokens/withVariants/...
│   ├── persistence/             memory | localStorage | http
│   └── export/theme-exporter.ts exporta evolium-theme.css + .json
├── components/src/lib/
│   ├── button/ input/ card/ badge/   um directório por componente
│   └── provide-components.ts    provideEvoComponents() — regista no Studio
├── layouts/src/lib/
│   ├── auth-shell/ dashboard-shell/ blank-shell/
├── pages/src/lib/
│   ├── auth/                    login, register, forgot-password, auth-routes.ts
│   ├── not-found/
│   └── theme-studio/            EvoThemeStudioPage, provide-evo-theme-studio.ts
├── services/src/lib/
│   ├── kernel/                  types, registry, bootstrap, provide-evo-services
│   │   └── http/                endpoint(), EvoHttp, evoDispatchInterceptor
│   └── plugins/auth/             authPlugin(), guards, interceptor
├── schematics/
│   ├── ng-add/                  instala + configura um projecto consumidor
│   ├── generators/               page, layout, ui-component, resource-plugin
│   └── utils/                    constants, styles, routes — partilhado
└── styles/                       evolium-theme.css, -components.css, -layouts.css
```

## Fluxos de dados principais

### 1. A cascata de tema (quatro níveis)

```
[evoTokens] na instância
   ↓ (herança CSS — vence sempre)
data-evo-variant (dentro de @layer evo.variants)
   ↓
[evoTokens] num ancestral (herança CSS)
   ↓
:root no styles.css do projecto (fora de @layer — vence a tudo dentro de camada)
   ↓
fallback do var() no CSS do componente (@layer evo.components)
```

`EvoThemeStore.setToken()` escreve num `signal`; um `effect()` gera o CSS via
`buildThemeCss()` (função pura, testável sem DOM) e escreve-o num único
`<style id="evo-theme">`, procurado por id antes de criar — é isto que evita
duplicação na hidratação SSR.

### 2. O arranque do kernel de plugins

```
provideEvoServices(withBaseUrl(), withPlugin(authPlugin()), withPlugin(x()))
   ↓ provideEnvironmentInitializer()
sortPlugins()              — ordena por dependsOn, detecta ciclos
   ↓
para cada plugin, em ordem: plugin.setup(ctx) → EvoResourceRegistry.register()
   ↓ (só depois de TODOS os setup() terem corrido)
para cada plugin com augment: plugin.augment(ctx)  — estende outros plugins
```

`ctx.http.client(endpoints)` devolve um cliente tipado a partir de um mapa
declarativo (`endpoint()`), que marca cada pedido com o `EVO_PLUGIN_ID` no
`HttpContext`. O `evoDispatchInterceptor` (registado uma vez, globalmente) lê
esse id e encaminha para a cadeia de `interceptors` desse plugin — mais os
`sharedInterceptors` de qualquer plugin, incluindo o Bearer do `authPlugin`.

### 3. Autenticação

```
EvoLoginPage → inject(EvoAuth).login() → POST /auth/login (anonymous: true)
   ↓
adoptSession() → signal interno + ctx.storage.set('has-session', '1')
   ↓
pedidos seguintes → authBearerInterceptor (sharedInterceptors) acrescenta Bearer
   ↓ (se 401)
auth.refreshToken() → POST /auth/refresh (anonymous: true — evita ciclo infinito)
```

`EvoAuth` é um `InjectionToken` dedicado; `EvoResourceRegistry.get('auth')`
devolve o mesmo objecto pelo `EvoResourceMap` (declaration merging). Ver
`docs/plugins.md` para a extensão sem fork (`EvoAuthExtensions`).

### 4. Instalação num projecto consumidor (`ng add`)

```
ng add @evolium-kit/toolkit
   ↓
addDependency() — peer deps (@angular/cdk, @angular/forms)
   ↓
addRootProvider() × 3 — HttpClient+dispatcher, provideEvoServices, provideEvoTheme
   ↓
ensureLayerStatement() + appendStyles() — styles.css
   ↓
addRoutes() — evoAuthRoutes() em app.routes.ts
```

Idempotente: cada passo verifica `temSimbolo()` antes de escrever. **Dois
passos ficam manuais** (avisados na consola, não escritos):
`withComponentInputBinding()` e a rota do Theme Studio — ver
`.claude/KNOWN-BUGS.md`.

## O playground (`src/`)

Não é uma demo cosmética — é onde cada alteração é exercitada antes de ser
dada por terminada:

```
src/app/
├── app.config.ts           providers reais, incluindo o Theme Studio
├── app.routes.ts            evoAuthRoutes() + rota /painel + 404
├── demo-api.interceptor.ts  API falsa (sem backend real) para /demo-api/*
├── facturas.plugin.ts       plugin ESCRITO FORA da toolkit — prova o kernel
├── playground/               componentes, tokens, override de instância/subárvore
└── painel/                   dashboard real: painel.ts, painel-shell.ts
```

Credenciais do mock: `ana@evolium.ao` / `1234`. Rotas: `/`, `/auth/login`,
`/painel` (atrás do guard), `/_evo/theme`.

## Ferramentas de build e verificação (`tools/`)

| Ficheiro                    | Faz o quê                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copy-schematic-assets.mjs` | copia `files/`, `collection.json`, `schema.json` para `dist/toolkit/schematics/`; escreve `package.json` com `type: commonjs`; corrige o `.npmignore` gerado pelo ng-packagr |
| `verify-dist.mjs`           | confirma que o artefacto tem os 6 entry points, as 3 folhas de estilo, os `exports` e os schematics — corre no CI a cada PR                                                  |
| `verify-install.mjs`        | `npm pack` → `ng new` num tmp dir → `npm install` do tarball → `ng add` → `ng build`. O único teste que exercita a instalação real                                           |

## Bugs já resolvidos (contexto, não acção)

Estes já estão corrigidos — registados aqui para quem tocar de novo nestas
áreas perceber porque o código é como é, e não os repetir:

1. **`EvoThemeStore.restore()` substituía os tokens em vez de os fundir** —
   um snapshot antigo apagava tokens novos (ex.: a paleta escura inteira).
   Corrigido para `{ ...defaults, ...saved }`.
2. **`authBearerInterceptor` estava em `interceptors`, não
   `sharedInterceptors`** — pedidos de outros plugins saíam sem `Authorization`.
3. **`"type": "module"` do ng-packagr quebrava os schematics CommonJS** —
   corrigido com um `package.json` local em `dist/toolkit/schematics/`.
4. **`./styles/*` e `./schematics/*` estavam fora do `exports`** — as folhas
   de CSS não eram importáveis fora do workspace de desenvolvimento.
5. **O `.npmignore` gerado pelo ng-packagr (`**/package.json`) apagava o
   `package.json` dos schematics do tarball** — só apanhado pelo
   `verify-install.mjs`, nunca pelos testes unitários.
6. **Conteúdo projectado (`ng-content`) não pode ser estilizado por
   `styleUrl` encapsulado** — `EvoField`/`EvoCard` precisam de estilos em
   `styles/evolium-components.css` e `evolium-layouts.css`, folhas globais.
7. **jsdom não resolve `var()` nem interpreta `@layer`** — os testes de
   cascata de componentes verificam o _texto_ do CSS gerado, não
   `getComputedStyle()`.
8. **`withComponentInputBinding()` atribui `undefined`** a inputs sem
   correspondência no `data` da rota, sobrepondo omissões — as páginas usam
   `transform` para as reinstalar.
9. **Rotas de `/auth/*` não podem viver no `authPlugin`** — criaria um ciclo
   (`/services` → `/pages` → `/services`). Vivem em `evoAuthRoutes()`, do
   lado de `/pages`.
10. **`ng add` "registava" o Theme Studio sem registar nada** — confirmado em
    produção em 2026-09-24 por um consumidor real (`/_evo/theme` dava sempre
    404). A causa: `provideEvoThemeStudio()` nunca foi chamado em lado nenhum
    do schematic — só `provideEvoComponents()` era acrescentado no passo dos
    metadados, e a mensagem final da consola ("Theme Studio em /_evo/theme")
    dava a entender, por engano, que estava pronto. Corrigido em `0.1.1` com
    `utils/theme-studio.ts`, um utilitário dedicado que insere
    `...(isDevMode() ? [provideEvoThemeStudio()] : [])` como a **primeira**
    entrada do array `providers` — antes do `provideRouter`, que é o
    requisito de ordem documentado em `docs/theming.md`. Não usa
    `addRootProvider` (que só sabe acrescentar ao fim); usa edição de texto
    directa no `Tree`, o mesmo padrão de `addRoutes()`. 5 testes de regressão
    em `ng-add.spec.ts` cobrem: o provider aparece; vem guardado por
    `isDevMode()`; vem antes do `provideRouter`; não aparece se a resposta for
    "não"; não duplica numa segunda corrida. Verificado também de ponta a
    ponta: `npm pack` do build corrigido → `npm install` → `ng generate
@evolium-kit/toolkit:ng-add` → inspecção byte-a-byte do `app.config.ts`
    gerado.
