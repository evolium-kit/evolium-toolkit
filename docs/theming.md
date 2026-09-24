# Tema e personalização

Como funciona a cascata de tokens, os quatro níveis de override, o Theme
Studio, e o que verificar antes de acrescentar um token novo.

Para a API completa (funções, assinaturas), ver
[`theme/README.md`](../projects/toolkit/theme/README.md) e
[`components/README.md`](../projects/toolkit/components/README.md). Este
documento explica o modelo mental por trás dessa API.

## Três camadas de tokens

```
Camada 1 — primitivos      --evo-palette-blue-600, --evo-scale-space-4
Camada 2 — semânticos       --evo-color-primary, --evo-space-md, --evo-radius-md
Camada 3 — por componente   --evo-button-bg, --evo-button-radius
```

Cada camada só refere a anterior. Um componente **nunca** refere um primitivo
directamente — se precisa de uma cor sem nome semântico, falta um token
semântico, não uma excepção à regra.

## Os quatro níveis de override

Do mais forte para o mais fraco:

| #   | Nível     | Como                                                | Alcance                            |
| --- | --------- | --------------------------------------------------- | ---------------------------------- |
| 1   | Instância | `[evoTokens]` no próprio componente                 | só aquele elemento                 |
| 2   | Variante  | `variant="danger"`                                  | todas as instâncias dessa variante |
| 3   | Subárvore | `[evoTokens]` num ancestral                         | tudo lá dentro, por herança        |
| 4   | Global    | `:root { --evo-* }` no `styles.css`, fora de camada | toda a aplicação                   |

```html
<!-- 1. Instância -->
<button evoButton [evoTokens]="{ 'button-bg': '#0d9488' }">Só este</button>

<!-- 2. Variante -->
<button evoButton variant="danger">Todos os danger</button>

<!-- 3. Subárvore -->
<section [evoTokens]="{ 'color-primary': '#7c3aed' }">
  <button evoButton>Herda roxo</button>
</section>
```

```css
/* 4. Global — fora de @layer, ganha sempre */
:root {
  --evo-button-radius: 9999px;
}
```

### Porque isto funciona sem `!important`

Os níveis 1 e 3 resolvem-se por **herança de CSS**, não por especificidade: o
valor de uma custom property num elemento é o que ele próprio declara, senão
o do seu pai. O nível 4 funciona porque CSS **fora** de qualquer `@layer`
ganha sempre a CSS **dentro** de uma camada — e todo o CSS da toolkit vive
dentro de `@layer evo.*`. Não há nenhum `!important` em lado nenhum.

## As duas regras de ouro (para quem escreve componentes)

Ver o detalhe completo em
[`components/README.md`](../projects/toolkit/components/README.md#as-duas-regras-de-ouro-do-css).
Resumo:

1. **Um componente nunca declara o valor do seu próprio token** — só o refere
   no fallback do `var()`. Declará-lo ganharia por proximidade a qualquer
   `:root` do projecto, e tornaria o nível 4 (global) impossível.
2. **Nunca registar um token de camada 3 com `@property { initial-value }`** —
   isso desliga o comportamento de fallback do `var()`, em silêncio.

Violar qualquer uma parte a personalização **sem erro nenhum a avisar**. É o
maior risco de regressão silenciosa em toda a toolkit.

## Alterar o tema em runtime

```ts
import { inject } from '@angular/core';
import { EvoThemeStore } from '@evolium-kit/toolkit/theme';

const theme = inject(EvoThemeStore);

theme.setToken('color-primary', '#7c3aed'); // afecta tudo
theme.setVariant('button', 'cta', { 'button-bg': '#f59e0b' }); // só a variante
theme.setScheme('dark');
await theme.persist();
theme.reset();
```

## Duas estratégias de persistência, e porque coexistem

|            | Runtime                                                            | Design-time                                |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------ |
| Como       | `withPersistence()` (localStorage) ou `withHttpPersistence({url})` | botão **Exportar** no Theme Studio         |
| Guarda em  | localStorage ou o teu backend                                      | `evolium-theme.css` + `.json`, committados |
| Serve para | experimentar, ou deixar o utilizador escolher                      | fixar a identidade visual do projecto      |

O ficheiro exportado é importado **fora de camada**, logo ganha sempre ao
`@layer evo.overrides` que o runtime escreve. O tema committado é a base de
produção; o runtime serve para experimentar por cima dele — nunca colidem.

## Theme Studio

Em desenvolvimento, `/_evo/theme` abre uma interface visual de três painéis:
lista de componentes à esquerda (com pesquisa), pré-visualização ao centro
(mostra todos os estados do componente em simultâneo — normal, hover, foco,
desactivado), e as propriedades editáveis à direita.

### Porque a interface do Studio não usa os componentes da toolkit

Os botões e painéis do próprio Studio usam tokens `--st-*`, fixos, e não
`EvoButton` nem `--evo-*`. Isto é deliberado: o Studio serve para corrigir um
tema mal configurado, e se a sua interface dependesse do tema que está a
editar, um tema que deixasse a aplicação ilegível deixaria também a
ferramenta de correcção ilegível.

### Registar um componente no Studio

Um componente só aparece na lista do Studio se tiver metadados registados:

```ts
// meu-componente.tokens.ts
import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

export const meuComponenteMeta: EvoComponentMeta = {
  id: 'meu-componente',
  label: 'O Meu Componente',
  category: 'Básicos',
  tokens: [
    {
      name: 'meu-componente-bg',
      label: 'Cor de fundo',
      type: 'color',
      fallback: '--evo-color-surface',
    },
  ],
};
```

```ts
// app.config.ts
import { provideEvoComponentMeta } from '@evolium-kit/toolkit/core';

providers: [provideEvoComponentMeta(meuComponenteMeta)];
```

Cada token declarado aqui tem de existir no CSS do componente, e vice-versa —
o painel de propriedades é gerado a partir desta lista, sem código manual.

## Acrescentar um token semântico novo

1. Declarar em `styles/evolium-theme.css`, dentro de `@layer evo.tokens`, em
   `:root`, referindo um primitivo existente.
2. Acrescentar o valor claro em `EVO_LIGHT_TOKENS` e o escuro em
   `EVO_DARK_TOKENS` (`theme/src/lib/default-theme.ts`).
3. **Verificar o contraste.** Texto sobre fundo: mínimo **4.5:1**. Limites de
   controlos interactivos (bordas, ícones): mínimo **3:1** (WCAG 1.4.11).

### Três armadilhas já encontradas, para não repetir

- `#16a34a` (o "green-600" mais comum) dá **3.30:1** sobre branco — reprova
  para texto. O `success` da toolkit é `#15803d` (5.02:1) por esta razão.
- `#cbd5e1` como borda de campo dá **1.48:1** — reprova o critério 1.4.11.
  Por isso existem dois tokens de borda: `border` (decorativo, sem requisito
  de contraste) e `border-strong` (interactivo, ≥ 3:1).
- Em modo escuro, um botão primário com `bg:#3b82f6` e texto branco dá
  **3.68:1** — reprova. A convenção do "flat dark" é inverter (`bg` claro,
  `fg` escuro): `bg:#60a5fa` com `fg:#0f172a` dá 7.08:1.

## SSR: três regras que não se negoceiam

- **Nunca ramificar o template por esquema de tema.** `@if (scheme() === 'dark')`
  no template dá uma árvore diferente no servidor e no cliente → `NG0500` na
  hidratação. Toda a diferença claro/escuro é resolvida por CSS
  (`[data-evo-scheme]`), nunca por controlo de fluxo no template.
- `localStorage` só é lido depois da hidratação (não existe no servidor). Se
  precisares de que o modo escuro persistido já esteja correcto no primeiro
  HTML servido, usa um adapter de **cookie**, legível no servidor via
  `inject(REQUEST)`.
- O `EvoThemeStore` escreve o CSS num único `<style id="evo-theme">`,
  procurando-o por `id` antes de criar um novo — é isto que evita duplicação
  na hidratação e garante que o HTML servido já leva o tema aplicado (sem
  flash de tema por omissão).

## Segurança: porque os valores de tokens são validados

`buildThemeCss()` (em `theme/src/lib/build-theme-css.ts`) valida todos os
nomes contra `/^--[a-zA-Z0-9_-]+$/` e rejeita valores com `< > { } \`,
`@import`, `url(` ou `expression(`.

Isto não é excesso de cuidado: os valores de tokens podem vir do Theme Studio
e, através dele, de um backend. Um valor como `red}</style><script>…`
escaparia do bloco `<style>` se não fosse validado — e o `DomSanitizer` do
Angular **não** protege o `textContent` de um `<style>`. Qualquer alteração a
este ficheiro precisa de teste dedicado contra tentativas de escape.

## Ver também

- [`theme/README.md`](../projects/toolkit/theme/README.md) — API completa
- [`components/README.md`](../projects/toolkit/components/README.md) — como
  construir um componente novo já conforme
- [`architecture.md`](architecture.md) — porque as camadas de CSS e de código
  estão desenhadas desta forma
