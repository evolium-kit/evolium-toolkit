# @evolium-kit/toolkit {{VERSAO}} — guia para agentes de IA

Índice completo da toolkit **na versão instalada**, para agentes de IA (Claude
Code, Cursor, Copilot…) que trabalham num projecto que a consome. Este ficheiro
é gerado no build da toolkit e viaja dentro do pacote: actualizar a toolkit
actualiza-o.

## Como ler este guia

- Todos os caminhos são **relativos a este ficheiro**, isto é, a
  `node_modules/@evolium-kit/toolkit/`. Exemplo: `components/README.md` é
  `node_modules/@evolium-kit/toolkit/components/README.md`.
- O `node_modules` costuma estar no `.gitignore`, e as ferramentas de pesquisa
  (Grep/Glob, ripgrep) **ignoram-no**. Não procures a toolkit por pesquisa:
  **lê directamente os caminhos listados aqui**.
- Ordem recomendada: esta página → o README do recurso em causa → os tipos em
  `types/evolium-kit-toolkit-<entry>.d.ts`, se precisares da assinatura exacta.
- A versão instalada está em `package.json`. As alterações de cada versão
  estão em `CHANGELOG.md`.

## Regras para quem usa a toolkit

Violar estas regras parte o projecto **sem erro visível**: um tema que deixa
de se aplicar, um interceptor que não corre, um erro de hidratação.

### Antes de escrever código

1. **Reutilizar antes de criar.** Ver as tabelas de componentes, layouts e
   páginas abaixo. Não reimplementar botões, campos, selects, cartões, shells
   nem login: usar `evoButton`, `evo-text-field`, `evo-select`, `evo-card`,
   `evo-dashboard-shell`, `evoAuthRoutes()`, …
2. **Importar só dos entry points públicos**: `@evolium-kit/toolkit/core`,
   `/theme`, `/components`, `/layouts`, `/pages`, `/services`. Nunca de
   caminhos internos (`fesm2022/`, `src/lib/`, `types/`).
3. **Angular moderno**: componentes standalone, zoneless, `OnPush`, signals,
   `input()`/`output()`/`model()`. Nada de `NgModule`, `zone.js` nem
   `@Input`/`@Output`.
4. **SSR-safe**: nada de `window`/`document`/`localStorage` fora de
   `afterNextRender()` ou `isPlatformBrowser()`. Nunca ramificar o template por
   esquema de tema (`@if (scheme() === 'dark')` dá `NG0500`): claro/escuro é CSS.

### Aparência: só por tokens

5. **Nunca** `::ng-deep`, nunca reescrever as classes `.evo-*`, nunca cores ou
   medidas literais num componente. Personaliza-se por CSS custom properties
   `--evo-*`, em quatro níveis (do mais forte para o mais fraco):

   | Nível     | Como                                                   | Alcance              |
   | --------- | ------------------------------------------------------ | -------------------- |
   | Instância | `[evoTokens]="{ 'button-bg': '#0d9488' }"` no elemento | só esse elemento     |
   | Variante  | `variant="danger"` (ou uma variante do projecto)       | todas dessa variante |
   | Subárvore | `[evoTokens]` num ancestral                            | tudo lá dentro       |
   | Global    | `:root { --evo-…: … }` no `styles.css`, fora de camada | a aplicação inteira  |

6. Em `[evoTokens]` a chave é o **nome curto completo**, com o prefixo do
   componente: `'text-field-ring-width'`, nunca `'ring-width'`. A directiva só
   acrescenta `--evo-`. Os nomes são verificados na compilação (`EvoTokenMap`).
7. Cores e espaços vêm dos **tokens semânticos** (`--evo-color-primary`,
   `--evo-space-md`, `--evo-radius-md`…), nunca dos primitivos
   (`--evo-palette-*`, `--evo-scale-*`) nem de literais. Texto com contraste
   ≥ 4.5:1; limites de controlos ≥ 3:1. A lista das variáveis que o projecto
   tem de ter definidas (e os seus valores) está em `docs/variable-tokens.md`.
8. Num componente **do projecto** que siga o padrão da toolkit: o valor por
   omissão vive no fallback do `var()` — o componente **nunca declara** o seu
   próprio token (`.x { --evo-x-bg: red }` torna o override global impossível),
   e nunca regista tokens de componente com `@property`.

### Serviços e dados

9. Recursos HTTP são **plugins** do kernel: `provideEvoServices(withBaseUrl(…),
withPlugin(xPlugin()))`. Gerar com `ng g @evolium-kit/toolkit:resource-plugin`.
10. Qualquer interceptor que deva afectar pedidos **de outros plugins**
    (autenticação, cabeçalhos globais) vai em `sharedInterceptors`, não em
    `interceptors` — estes só correm nos pedidos do próprio plugin.
11. Num plugin: erros sempre por `ctx.toError(e)` (chegam como `EvoError`),
    armazenamento por `ctx.storage` (nunca `localStorage` directo), estado em
    signals só de leitura, e `declare module` para aumentar o `EvoResourceMap`.
12. O `HttpClient` tem de usar `withInterceptors([evoDispatchInterceptor])`:
    sem ele nenhum interceptor de plugin corre e a autenticação falha em silêncio.

### Formulários

13. Campos: `evo-text-field` e `evo-select`, com Reactive Forms. O erro do
    controlo aparece sozinho depois de `touched`; as mensagens configuram-se com
    `provideEvoTextFieldMessages()` / `provideEvoSelectMessages()`. Para um
    `<input>` nativo simples: `input[evoInput]` dentro de `evo-field`.

### Geradores

14. Preferir os geradores a escrever à mão — já seguem as regras acima (ver a
    secção "Geradores" no fim). Num projecto consumidor correm com
    `ng g @evolium-kit/toolkit:<gerador>`.

### Ao actualizar a toolkit

15. Ler as secções novas de `CHANGELOG.md` antes de mudar código. Depois de
    `npm install @evolium-kit/toolkit@<versão>`, este guia já descreve a versão
    nova. Se o `ng serve` continuar a servir a antiga: parar e apagar
    `.angular/cache`.

## Documentação conceptual

| Tema                                       | Ficheiro                  |
| ------------------------------------------ | ------------------------- |
| Visão geral e entry points                 | `README.md`               |
| Primeiros passos                           | `docs/getting-started.md` |
| Tema: camadas de tokens, overrides, Studio | `docs/theming.md`         |
| Variáveis CSS que o projecto tem de ter    | `docs/variable-tokens.md` |
| Mapa rápido de todos os componentes        | `docs/index-componentes.md` |
| Kernel de serviços e plugins               | `docs/plugins.md`         |
| Alterações por versão                      | `CHANGELOG.md`            |

Os links relativos dentro destes documentos apontam para o repositório da
toolkit; dentro do pacote, usar os caminhos deste guia.

<!-- O resto deste ficheiro é gerado por tools/generate-agents-md.mjs. -->
