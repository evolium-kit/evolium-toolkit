# @evolium-kit/toolkit/theme

Design tokens, geração de CSS em runtime, persistência e Theme Studio.

O tema é feito de CSS custom properties em três camadas. Nada aqui usa
`::ng-deep`, `ViewEncapsulation.None` ou `!important` — a cascata do CSS faz todo
o trabalho, o que é exactamente o que torna a personalização previsível.

---

## Parte 1 — Usar num projecto novo

### 1. Providers

```ts
// app.config.ts
import {
  provideEvoTheme,
  withDarkMode,
  withPersistence,
  withTokens,
} from '@evolium-kit/toolkit/theme';
import { provideEvoThemeStudio } from '@evolium-kit/toolkit/pages';

export const appConfig: ApplicationConfig = {
  providers: [
    // ATENÇÃO à ordem: o Studio tem de vir ANTES do provideRouter.
    // As rotas seguem a ordem dos providers, e um '**' existente
    // apanharia /_evo/theme primeiro, deixando o Studio inacessível.
    ...(isDevMode() ? [provideEvoThemeStudio()] : []),
    provideRouter(routes),

    provideEvoTheme(
      withTokens({
        light: { 'color-primary': '#0d9488', 'radius-md': '8px' },
        dark: { 'color-primary': '#2dd4bf' },
      }),
      withDarkMode({ initial: 'system' }),
      withPersistence(), // localStorage; ou withHttpPersistence({ url })
    ),
  ],
};
```

Em dev, se a rota do Studio ficar sombreada por um wildcard, aparece um aviso
explícito na consola com os índices em causa.

### 2. Estilos

```css
/* src/styles.css */

/* Esta linha TEM de ser a primeira, antes de qualquer @import.
   Sem ela, o Tailwind declara a sua própria ordem e as camadas evo.*
   acabam DEPOIS de utilities — `class="evo-button p-6"` deixaria de
   respeitar o p-6. É o único requisito não-óbvio da integração. */
@layer theme, base, evo.tokens, evo.base, evo.components, evo.variants, evo.overrides,
       components, utilities;

@import 'tailwindcss'; /* opcional */
@import '@evolium-kit/toolkit/styles/evolium-theme.css'; /* obrigatório */

/* Ponte opcional: o Tailwind passa a falar --evo-*.
   `inline` é obrigatório — sem ele o Tailwind resolve o var() em build
   e perde a reactividade ao Theme Studio. */
@theme inline {
  --color-primary: var(--evo-color-primary);
  --color-surface: var(--evo-color-surface);
  --radius-md: var(--evo-radius-md);
}

/* Overrides do projecto: fora de camada, ganham sempre. */
:root {
  --evo-color-primary: #0d9488;
  --evo-button-radius: 9999px;
}
```

**A toolkit não depende de Tailwind.** Nenhum ficheiro da library usa `@apply`
ou classes utilitárias. O bloco `@theme inline` é só para quem já usa Tailwind.

### 3. Alterar o tema em runtime

```ts
const theme = inject(EvoThemeStore);

theme.setToken('color-primary', '#7c3aed'); // afecta tudo
theme.setVariant('button', 'cta', { 'button-bg': '#f59e0b' }); // só a variante
theme.setScheme('dark');
await theme.persist();
theme.reset();
```

### 4. As duas estratégias de persistência

Coexistem por construção, e servem momentos diferentes do ciclo de vida:

|           | Runtime                                            | Design-time                               |
| --------- | -------------------------------------------------- | ----------------------------------------- |
| Como      | `withPersistence()` / `withHttpPersistence({url})` | botão _Exportar_ no Theme Studio          |
| Guarda em | localStorage ou backend                            | `evolium-theme.css` + `.json` committados |
| Para      | experimentar, ou deixar o cliente escolher         | fixar a identidade visual do projecto     |

O ficheiro exportado é importado **fora de camada** no `styles.css`, logo ganha
ao `@layer evo.overrides` que o runtime escreve. O tema committado é a base de
produção; o runtime serve para experimentar por cima.

```css
/* src/styles.css, depois dos imports da toolkit */
@import './styles/evolium-theme.css'; /* gerado pelo Studio, committado */
```

---

## Parte 2 — Estender o tema

### Taxonomia em três camadas

```
Camada 1 — primitivos     --evo-palette-blue-600, --evo-scale-space-4
Camada 2 — semânticos     --evo-color-primary, --evo-space-md, --evo-radius-md
Camada 3 — por componente --evo-button-bg, --evo-button-radius
```

Regra de dependência: a camada 3 refere a 2, a 2 refere a 1, e a 1 tem valores
literais. Um componente **nunca** refere um primitivo directamente — se precisa
de uma cor que não tem nome semântico, falta um token semântico.

### Acrescentar um token semântico

1. Declarar em `styles/evolium-theme.css`, dentro de `@layer evo.tokens`, em
   `:root`, referindo um primitivo.
2. Acrescentar o valor para modo escuro em `EVO_DARK_TOKENS`
   (`lib/default-theme.ts`) e para modo claro em `EVO_LIGHT_TOKENS`.
3. **Verificar o contraste.** Texto sobre fundo: mínimo 4.5:1. Limites de
   controlos interactivos: mínimo 3:1 (WCAG 1.4.11).

### Contrastes verificados, e três armadilhas

| Token              | Claro     | Rácio  | Escuro    | Rácio  |
| ------------------ | --------- | ------ | --------- | ------ |
| `on-surface`       | `#0f172a` | 17.4:1 | `#e2e8f0` | 14.6:1 |
| `on-surface-muted` | `#64748b` | 4.76:1 | `#94a3b8` | 7.01:1 |
| `border-strong`    | `#64748b` | 4.76:1 | `#475569` | 3.3:1  |
| `primary`          | `#2563eb` | 4.97:1 | `#60a5fa` | 7.08:1 |
| `success`          | `#15803d` | 5.02:1 | `#4ade80` | 10.3:1 |
| `danger`           | `#dc2626` | 4.82:1 | `#f87171` | 6.50:1 |

Evitadas de propósito:

- `#16a34a` (green-600) dá **3.30:1** sobre branco e reprova AA para texto. Daí
  `success = #15803d`.
- `#cbd5e1` como borda de input dá **1.48:1** e reprova o critério 1.4.11. Por
  isso existem dois tokens: `border` (decorativo) e `border-strong` (interactivo).
- Em modo escuro, `bg:#3b82f6` com texto branco dá **3.68:1**. O botão primário
  inverte-se (`bg:#60a5fa`, `fg:#0f172a`, 7.08:1) — é também a convenção do flat dark.

### Acrescentar um token de componente

Pertence ao módulo do componente, não a este. Ver
[`../components/README.md`](../components/README.md), em particular as duas
regras de ouro:

1. O CSS do componente **nunca declara** o seu próprio token — o default vive no
   fallback do `var()`.
2. **Nunca registar** tokens de componente com `@property { initial-value }` —
   isso desliga a cascata de fallback sem dar erro.

### SSR

O `EvoThemeStore` escreve num `<style id="evo-theme">` único, procurando-o por
`id` antes de criar. No servidor, o `DOCUMENT` é serializado inteiro, portanto o
CSS do tema sai já no HTML servido: sem flash e sem `document` global.

Três regras que não se negoceiam:

- **Nunca ramificar o template por tema.** `@if (scheme() === 'dark')` renderiza
  diferente no servidor e no cliente, o que dá NG0500. Toda a diferença é CSS.
- `localStorage` só é lido depois da hidratação. Se o modo escuro persistido for
  requisito de produto, usar **cookie** (legível no servidor via `inject(REQUEST)`)
  em vez de localStorage.
- Se houver CSP, o `CSP_NONCE` é propagado automaticamente para o `<style>`.

### Segurança

`buildThemeCss()` valida todos os nomes contra `/^--[a-zA-Z0-9_-]+$/` e rejeita
valores com `< > { } \`, `@import`, `url(` ou `expression(`.

Isto **não** é defensivo em excesso: os valores vêm do Theme Studio e podem vir
de um backend, e um valor como `red}</style><script>…` escaparia do bloco
`<style>`. O `DomSanitizer` não protege `textContent` de um `<style>` — esta
validação é a única barreira. Qualquer alteração a `token-utils.ts` precisa de
teste dedicado.
