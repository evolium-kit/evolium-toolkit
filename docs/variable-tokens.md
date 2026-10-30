# Variáveis CSS obrigatórias (`variable-tokens`)

A lista de custom properties `--evo-*` que **todo o projecto que instala a
toolkit tem de ter definidas**, o que acontece se faltarem, e como as obter.
Escrito para quem consome a toolkit — pessoas e agentes de IA.

Para o modelo mental (camadas, níveis de override, Theme Studio) ver
[`theming.md`](theming.md). Este ficheiro é só o contrato: **o que tem de existir**.

## Resumo

- Os tokens obrigatórios são os **62** declarados em
  `@evolium-kit/toolkit/styles/evolium-theme.css`. Vêm de graça: o `ng add`
  importa esse ficheiro no `styles.css`. **Não é preciso copiá-los nem
  redeclará-los.**
- Os tokens **por componente** (`--evo-button-bg`, `--evo-drawer-width-md`…) são
  **opcionais**: cada componente traz o seu valor por omissão no fallback do
  `var()`. Só se definem para personalizar.
- Um token em falta **não dá erro**: o `var()` fica inválido e a propriedade volta
  ao valor inicial do CSS (texto preto, fundo transparente, espaçamento 0…). É
  por isso que a lista tem de estar completa e verificada.

## Pré-requisitos no `styles.css`

O `ng add` escreve isto; confirmar que está lá (e pela mesma ordem):

```css
/* 1.ª regra do ficheiro, antes de qualquer @import */
@layer theme, base, evo.tokens, evo.base, evo.components, evo.variants, evo.overrides,
  components, utilities;

@import '@evolium-kit/toolkit/styles/evolium-theme.css'; /* os tokens abaixo */
@import '@evolium-kit/toolkit/styles/evolium-components.css';
@import '@evolium-kit/toolkit/styles/evolium-layouts.css';
```

| Requisito                                  | Porquê                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `@layer …` é a **primeira** regra          | Sem ela, o Tailwind declara a sua ordem e as camadas `evo.*` ficam depois de `utilities` (`class="evo-button p-6"` ignora o `p-6`). |
| `evolium-theme.css` importado **primeiro** | Define os tokens; os outros dois só os consomem.                                                                           |
| Imports da toolkit **depois** do Tailwind  | A ponte `@theme inline` do Tailwind tem de poder referi-los.                                                               |

## Os tokens obrigatórios

Valores por omissão (tema claro). Todos vivem em `@layer evo.tokens`, em `:root`.

### Camada 2 — semânticos (os que o CSS do projecto deve usar)

**Superfícies e texto**

| Token                          | Omissão               | Uso                                  |
| ------------------------------ | --------------------- | ------------------------------------ |
| `--evo-color-surface`          | `slate-0` `#ffffff`   | fundo base                           |
| `--evo-color-surface-sunken`   | `slate-50` `#f8fafc`  | fundo rebaixado (cabeçalhos, faixas) |
| `--evo-color-surface-raised`   | `slate-0` `#ffffff`   | fundo elevado (cartões, menus)       |
| `--evo-color-on-surface`       | `slate-900` `#0f172a` | texto principal                      |
| `--evo-color-on-surface-muted` | `slate-500` `#64748b` | texto secundário                     |
| `--evo-color-border`           | `slate-200` `#e2e8f0` | borda **decorativa** (sem requisito de contraste) |
| `--evo-color-border-strong`    | `slate-500` `#64748b` | borda de controlo **interactivo** (≥ 3:1) |

**Cores de estado** — cada estado tem `cor`, `-soft` (fundo suave) e `on-` (texto sobre a cor)

| Token                                                                     | Omissão                       |
| ------------------------------------------------------------------------- | ----------------------------- |
| `--evo-color-primary` / `-hover` / `-soft` / `--evo-color-on-primary`     | `#2563eb` / `#1d4ed8` / `#eff6ff` / `#ffffff` |
| `--evo-color-success` / `-soft` / `--evo-color-on-success`                | `#15803d` / `#dcfce7` / `#ffffff` |
| `--evo-color-warning` / `-soft` / `--evo-color-on-warning`                | `#b45309` / `#fef3c7` / `#ffffff` |
| `--evo-color-danger` / `-soft` / `--evo-color-on-danger`                  | `#dc2626` / `#fee2e2` / `#ffffff` |

**Espaço, raio, contorno e foco**

| Token                                                                  | Omissão                      |
| ---------------------------------------------------------------------- | ---------------------------- |
| `--evo-space-xs` / `-sm` / `-md` / `-lg` / `-xl`                       | `0.25` / `0.5` / `1` / `1.5` / `2` `rem` (via `--evo-scale-space-*`) |
| `--evo-radius-sm` / `-md` / `-lg` / `-full`                            | `4px` / `6px` / `10px` / `9999px` |
| `--evo-border-width`                                                   | `1px`                        |
| `--evo-focus-ring-color`                                               | `var(--evo-color-primary)`   |
| `--evo-focus-ring-width`                                               | `0px` (o foco é desenhado pelo componente) |
| `--evo-focus-ring-offset`                                              | `2px`                        |

**Elevação, tipografia e movimento**

| Token                                                                    | Omissão                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `--evo-elevation-1`                                                      | `none` (flat: elevação é borda, não sombra)          |
| `--evo-elevation-2`                                                      | `0 1px 2px color-mix(in srgb, slate-900 8%, transparent)` |
| `--evo-font-sans`                                                        | `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` |
| `--evo-font-size-sm` / `-md` / `-lg`                                     | `0.8125rem` / `0.875rem` / `1rem`                    |
| `--evo-duration-fast`                                                    | `120ms`                                              |
| `--evo-easing`                                                           | `cubic-bezier(0.2, 0, 0, 1)`                         |

Também em `:root`: `color-scheme: light dark;` e
`accent-color: var(--evo-color-primary);`.

### Camada 1 — primitivos (existem, mas **não** se usam directamente)

| Token                                                  | Valores                                  |
| ------------------------------------------------------ | ---------------------------------------- |
| `--evo-palette-slate-{0,50,100,200,300,400,500,600,700,800,900,950}` | escala slate (`#ffffff` … `#020617`) |
| `--evo-scale-space-{1,2,3,4,6,8}`                      | `0.25` `0.5` `0.75` `1` `1.5` `2` `rem`  |
| `--evo-scale-radius-{1,2,3}`                           | `4px` `6px` `10px`                       |

São a base dos semânticos. Um componente — ou o CSS do projecto — refere sempre
um semântico; se falta um nome para uma cor, falta um token semântico, não
uma excepção.

## Modo escuro e o `EvoThemeStore`

As cores semânticas têm **duas fontes**:

1. **`evolium-theme.css`** — fallbacks estáticos (os valores acima). Garantem que
   o CSS funciona mesmo sem o store (por exemplo numa página estática de erro).
2. **`provideEvoTheme()`** — o `EvoThemeStore` escreve os 20 tokens `--evo-color-*`
   (claro e escuro) num único `<style id="evo-theme">`, em `@layer evo.overrides`.
   O modo escuro aplica-se com `:root[data-evo-scheme="dark"]` (ou
   `prefers-color-scheme: dark` quando o esquema é `system`).

Por isso, **um projecto que use `provideEvoTheme()` tem os 20 `--evo-color-*` em
dois sítios** — e o do store ganha ao fallback. Os tokens estruturais (espaço,
raio, tipografia, foco, movimento) vivem **só** no CSS estático: não mudam com o
esquema.

Valores escuros por omissão (`EVO_DARK_TOKENS`), para quem precisa de os
espelhar à mão:

| Token                          | Escuro    | Token                          | Escuro    |
| ------------------------------ | --------- | ------------------------------ | --------- |
| `--evo-color-surface`          | `#0f172a` | `--evo-color-success`          | `#4ade80` |
| `--evo-color-surface-sunken`   | `#020617` | `--evo-color-success-soft`     | `#14532d` |
| `--evo-color-surface-raised`   | `#1e293b` | `--evo-color-on-success`       | `#0f172a` |
| `--evo-color-on-surface`       | `#e2e8f0` | `--evo-color-warning`          | `#fbbf24` |
| `--evo-color-on-surface-muted` | `#94a3b8` | `--evo-color-warning-soft`     | `#78350f` |
| `--evo-color-border`           | `#1e293b` | `--evo-color-on-warning`       | `#0f172a` |
| `--evo-color-border-strong`    | `#475569` | `--evo-color-danger`           | `#f87171` |
| `--evo-color-primary`          | `#60a5fa` | `--evo-color-danger-soft`      | `#7f1d1d` |
| `--evo-color-primary-hover`    | `#93c5fd` | `--evo-color-on-danger`        | `#0f172a` |
| `--evo-color-primary-soft`     | `#1e3a8a` | `--evo-color-on-primary`       | `#0f172a` |

## Regras para o projecto consumidor

1. **Não apagar nem renomear** nenhum token desta lista, nem remover o import de
   `evolium-theme.css`. Falha em silêncio (ver Resumo).
2. **Para alterar um valor, redeclará-lo fora de camada**, no `styles.css`:

   ```css
   :root {
     --evo-color-primary: #7c3aed;
     --evo-radius-md: 8px;
   }
   ```

   CSS fora de `@layer` ganha sempre ao CSS dentro de `evo.*`; não é preciso
   `!important`. Mas, com `provideEvoTheme()`, as **cores** (`--evo-color-*`) são
   reescritas pelo store em `evo.overrides` — para essas, usar
   `theme.setToken('color-primary', '#7c3aed')` ou o ficheiro exportado do Theme
   Studio (`evolium-theme.css`, importado fora de camada).
3. **Contraste ao alterar cores:** texto sobre fundo ≥ **4.5:1**; limites de
   controlos interactivos (bordas, ícones) ≥ **3:1** (WCAG 1.4.11). Não usar
   `#16a34a` como `success` (3.30:1 sobre branco).
4. **Tokens de projecto novos** (próprios, não da toolkit): usar outro prefixo, ou
   `--evo-<componente>-<propriedade>` apenas em componentes que sigam o padrão da
   toolkit — o componente **refere** o token no fallback do `var()`, **nunca o
   declara** (`.x { --evo-x-bg: … }` torna o override global impossível). Nunca
   registar tokens de componente com `@property { initial-value }`.
5. **Nunca** referir `--evo-palette-*` ou `--evo-scale-*` em CSS do projecto.
6. **Nunca ramificar o template** por esquema de tema (`@if (scheme() === 'dark')`
   → `NG0500`). Claro/escuro é CSS.

## Tokens por componente (opcionais)

Cada componente, layout e página tem os seus (`--evo-button-*`,
`--evo-text-field-*`, `--evo-drawer-*`, `--evo-data-table-*`…). **Não é
preciso definir nenhum.** A lista completa e o nome exacto de cada um estão em:

- `AGENTS.md`, secção "Tokens de tema" (gerado, sempre da versão instalada);
- a interface `EvoTokenNames` (`@evolium-kit/toolkit/core`), verificada na
  compilação quando se usa `[evoTokens]`;
- o README de cada componente.

Em `[evoTokens]` a chave é o nome **sem** `--evo-` e **com** o prefixo do
componente: `'button-bg'`, nunca `'bg'`.

## Verificar numa instalação

No browser (DevTools → Console), os 62 têm de devolver valor não vazio:

```js
const s = getComputedStyle(document.documentElement);
['--evo-color-surface', '--evo-color-primary', '--evo-space-md', '--evo-radius-md',
 '--evo-font-sans', '--evo-duration-fast'].map((t) => [t, s.getPropertyValue(t).trim()]);
```

Se algum vier vazio: o `evolium-theme.css` não está importado, ou o import está
depois de uma regra que o impede de carregar (o `@layer` tem de ser a 1.ª regra).
Correr `ng add @evolium-kit/toolkit` outra vez repõe ambos sem duplicar.

## Manter (quem desenvolve a toolkit)

- Este ficheiro descreve `projects/toolkit/styles/evolium-theme.css` e
  `projects/toolkit/theme/src/lib/default-theme.ts`. **Alterou-se um token nesses
  ficheiros? Actualizar aqui** (tabelas e a contagem "62").
- Segue para o pacote em `dist/toolkit/docs/variable-tokens.md` (lista `DOCS` em
  `tools/generate-agents-md.mjs`) e está referenciado em `AGENTS.base.md`, para o
  agente do projecto consumidor o ler.
