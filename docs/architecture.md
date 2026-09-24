# Arquitectura

Este documento explica **porquê** a toolkit está organizada da forma como
está — para quem vai alterá-la, e não só consumi-la. Se só precisas de a
usar num projecto, [`getting-started.md`](getting-started.md) chega.

## Um pacote, seis entry points

```
@evolium-kit/toolkit
├── /core        tipos, tokens de DI, utilitários — sem dependências pesadas
├── /theme       design tokens, ThemeStore, persistência
├── /components  componentes de UI temáveis
├── /layouts     shells de aplicação
├── /pages       páginas prontas + Theme Studio
└── /services    kernel de plugins + plugin de autenticação
```

É um único pacote npm — uma só versão, uma só instalação — com **múltiplos
entry points** (secondary entry points do ng-packagr). Cada um compila para o
seu próprio bundle, o que significa que importar `@evolium-kit/toolkit/components`
não arrasta o kernel de serviços para o teu bundle se não precisares dele.

## A regra que nunca se quebra: dependências só para baixo

```
pages    ─────┐
layouts  ─────┼──> components ──> theme ──> core
services ─────┘                              ^
                  (services depende só de core)
```

Cada seta é um `import` permitido. **Nunca ao contrário.** Concretamente:

- `core` não importa de mais nenhum entry point. É a única camada que todas
  as outras podem importar.
- `theme` só importa de `core`.
- `components` importa de `theme` e `core`.
- `layouts` e `pages` importam de `components`, `theme` e `core`.
- `services` só importa de `core` — **nunca** de `components`, `layouts` ou
  `pages`.

### Porque é que isto importa na prática

O ng-packagr recusa-se a compilar um entry point que tenha uma dependência
circular com outro. Isto já aconteceu uma vez durante o desenvolvimento: o
plugin de autenticação (em `/services`) tentou expor directamente as rotas
para `/auth/login`, o que obrigava a importar `EvoLoginPage` de `/pages` — mas
`/pages` já importa `/services` para consumir o resource `auth`. Ciclo.

A solução foi mover a responsabilidade das rotas para o lado de cima: é
`/pages` que exporta `evoAuthRoutes()`, e não `/services` que as fornece. O
plugin de autenticação continua a não saber que existem páginas.

**Regra prática para quem contribui:** se precisas de importar de um entry
point "acima" do teu na tabela, o código que precisa dessa importação não
pertence onde o puseste — pertence lá em cima.

## Porque o kernel de serviços não conhece plugins

O `EvoResourceRegistry` e o `provideEvoServices()`, em `/services/kernel`, não
têm uma única linha que mencione `auth`, `facturas`, ou qualquer resource
concreto. O kernel sabe apenas:

1. correr o `setup()` de cada plugin registado, por ordem topológica de
   `dependsOn`;
2. guardar o que esse `setup()` devolve, indexado pelo nome do plugin;
3. entregar a cada plugin um `EvoPluginContext` (HTTP, storage, eventos).

O plugin de autenticação (`authPlugin()`) é construído exactamente sobre os
mesmos contratos que um plugin de facturas que escreves no teu projecto. Não
tem estatuto especial, não tem atalho no kernel. Isto é verificável: o teste
`kernel de plugins` em `provide-evo-services.spec.ts` regista um plugin
inventado, de fora da toolkit, e prova que ele funciona sem qualquer alteração
ao kernel.

**Regra prática:** se para resolver um problema de serviços sentes vontade de
abrir `services/src/lib/kernel/` e acrescentar um `if` que mencione o nome de
um plugin, pára. Ou falta ao kernel um ponto de extensão genérico — o que é
uma decisão de arquitectura a discutir primeiro — ou o problema resolve-se do
lado do plugin. Ver [`plugins.md`](plugins.md#a-lei-fundamental).

## Camadas de CSS: porque a personalização não usa `!important`

Um componente da toolkit nunca declara o valor por omissão do seu próprio
token — só o refere no fallback do `var()`:

```css
/* .evo-button, dentro de @layer evo.components */
background-color: var(--evo-button-bg, var(--evo-color-primary));
```

Isto, combinado com `@layer` do CSS nativo, dá quatro níveis de override sem
nenhum precisar de vencer por especificidade:

1. `[evoTokens]` na própria instância — o mais forte, por herança directa;
2. uma variante nomeada (`data-evo-variant`) — declarada dentro de
   `@layer evo.variants`;
3. `[evoTokens]` num ancestral — afecta toda a subárvore, por herança de CSS;
4. `:root` no `styles.css` do projecto, **fora** de qualquer `@layer` — ganha
   sempre a regras dentro de camadas, por definição da cascata CSS.

Ver [`theming.md`](theming.md) para o detalhe completo, incluindo porque o
Theme Studio usa os seus próprios tokens (`--st-*`) em vez de `--evo-*`.

## Porque a interface do Studio não usa os próprios componentes

O Theme Studio (`EvoThemeStudioPage`, em `/pages`) constrói a sua interface —
os botões "Guardar" e "Exportar", os painéis, o toggle claro/escuro — a partir
de tokens próprios (`--st-*`), **nunca** de `EvoButton` nem de `--evo-*`.

A razão: o Studio existe para editar o tema, incluindo temas que deixam a
aplicação ilegível. Se a sua própria interface dependesse de `--evo-color-primary`,
alguém que pusesse o primário igual ao fundo tornaria a ferramenta que serve
para corrigir isso também ilegível — sem saída a não ser limpar o
`localStorage` à mão.

## Camadas de teste, e porque o jsdom não chega

Duas suites de testes, com propósitos diferentes:

- **`test:lib`** (Vitest + jsdom, via `@angular/build:unit-test`) — testa
  componentes, o `ThemeStore`, o kernel de plugins.
- **`test:schematics`** (Vitest em Node puro) — testa os geradores (`ng add`,
  `resource-plugin`, etc.), que manipulam ficheiros através do `Tree` do
  Angular DevKit. Não corre no browser porque não há DOM nenhum envolvido.

**Limitação descoberta a construir os componentes:** o jsdom não resolve
`var()` nem interpreta `@layer`. Um teste que verificasse a cascata de tokens
por `getComputedStyle()` passaria sempre, sem medir nada de real. Por isso os
testes de componentes verificam o **texto** do CSS gerado (que nenhum token
está declarado fora de `@layer evo.variants`), e a cascata a sério só é
verificada manualmente no browser, no playground em `src/app`.

## O playground não é decorativo

A aplicação em `src/` (fora de `projects/toolkit`) não é uma demo cosmética —
é onde a toolkit é exercitada antes de qualquer alteração ser considerada
terminada. Foi o playground, e não os testes unitários, que apanhou:

- o interceptor de autenticação a não chegar a pedidos de outros plugins
  (resolvido com `sharedInterceptors`, distinto de `interceptors`);
- o `ng add` a falhar num pacote instalado por causa de `"type": "module"`
  no `package.json` gerado pelo ng-packagr;
- as folhas de estilo fora do campo `exports`, o que as tornava não
  importáveis fora do workspace de desenvolvimento.

**Regra prática:** uma alteração à toolkit só está terminada depois de
verificada no playground — idealmente com `node tools/verify-install.mjs`,
que empacota o pacote a sério e instala-o num projecto Angular virgem.

## Ver também

- [`theming.md`](theming.md) — a taxonomia de tokens e a cascata, em detalhe
- [`plugins.md`](plugins.md) — o contrato completo de um plugin de serviço
- [`contributing.md`](contributing.md) — o processo de build, teste e
  verificação para quem altera a toolkit
