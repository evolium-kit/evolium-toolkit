# EvoPagination — `<evo-pagination>`

Paginação compacta: anterior/seguinte, páginas com reticências, resumo
"A mostrar 1–10 de 124" e selector de linhas por página. Não mostra dados, só
emite a página e o tamanho escolhidos. É a paginação do `evo-data-table` e
serve também para listas de cartões, galerias e resultados de pesquisa.

```
 A mostrar 11–20 de 124    Linhas por página [10 ▾]    ‹  1  2 (3) 4  5  …  13  ›
 └ showSummary             └ pageSizeOptions              └ item-* tokens  (3) = item-*-active
```

---

## Importar

```ts
import { EvoPagination } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoPagination],
  // …
})
```

---

## API

| Nome              | Tipo                | Omissão | Angular   | Descrição                                                                     |
| ----------------- | ------------------- | ------- | --------- | ----------------------------------------------------------------------------- |
| `page`            | `number`            | `1`     | `model()` | Página actual, a começar em 1. `[(page)]`. Uma página a mais mostra a última. |
| `pageSize`        | `number`            | `10`    | `model()` | Itens por página. `[(pageSize)]`. Mudar o tamanho volta à página 1.           |
| `length`          | `number`            | `0`     | `input()` | Número total de **itens** (não de páginas).                                   |
| `pageSizeOptions` | `readonly number[]` | `[]`    | `input()` | Com valores, mostra o selector de linhas por página (`select[evoInput]`).     |
| `siblings`        | `number`            | `1`     | `input()` | Páginas de cada lado da actual.                                               |
| `boundaries`      | `number`            | `1`     | `input()` | Páginas sempre visíveis no início e no fim.                                   |
| `showSummary`     | `boolean`           | `false` | `input()` | Mostra "A mostrar 1–10 de 124".                                               |
| `hideSinglePage`  | `boolean`           | `false` | `input()` | Esconde os botões quando só há uma página (resumo e selector ficam).          |
| `disabled`        | `boolean`           | `false` | `input()` | Desactiva todos os botões e o selector.                                       |
| `size`            | `EvoSize`           | `'md'`  | `input()` | `sm`, `md`, `lg`.                                                             |
| `ariaLabel`       | `string`            | `''`    | `input()` | Nome do `<nav>`. Por omissão, o das mensagens ("Paginação").                  |

O número de botões é sempre o mesmo (`2 × boundaries + 2 × siblings + 3`):
os botões não saltam de sítio ao mudar de página. A função que os calcula está
exportada como `evoPageItems(actual, total, siblings, boundaries)`.

Atributos reflectidos no host: `data-evo-size`, `data-evo-disabled`.

---

## Exemplos

### Mínimo

```html
<evo-pagination [(page)]="pagina" [length]="total()" />
```

### Com resumo e linhas por página

```html
<evo-pagination
  [(page)]="pagina"
  [(pageSize)]="porPagina"
  [length]="total()"
  [pageSizeOptions]="[12, 24, 48]"
  showSummary
/>
```

### Paginar uma grelha de cartões

```ts
protected readonly pagina = signal(1);
protected readonly porPagina = signal(12);
protected readonly visiveis = computed(() => {
  const inicio = (this.pagina() - 1) * this.porPagina();
  return this.produtos().slice(inicio, inicio + this.porPagina());
});
```

### Textos

```ts
provideEvoPaginationMessages({
  summary: (de, ate, total) => `${de}–${ate} de ${total} produtos`,
  pageSize: 'Por página',
});
```

Chaves: `label`, `previous`, `next`, `page(n)`, `pageSize`, `summary(de, ate, total)`.

---

## Personalizar

| Token                                | Controla                         | Herda de                       |
| ------------------------------------ | -------------------------------- | ------------------------------ |
| `--evo-pagination-item-size`         | altura e largura mínima          | — (`2rem`, 32px)               |
| `--evo-pagination-item-radius`       | raio dos botões                  | `--evo-radius-full`            |
| `--evo-pagination-item-border-color` | borda dos botões                 | `--evo-color-border`           |
| `--evo-pagination-item-fg`           | texto dos botões                 | `--evo-color-on-surface-muted` |
| `--evo-pagination-item-bg-active`    | fundo (e borda) da página actual | `--evo-color-primary`          |
| `--evo-pagination-item-fg-active`    | texto da página actual           | `--evo-color-on-primary`       |

`sm` usa 80% do `item-size`, `lg` 125%.

```css
:root {
  --evo-pagination-item-radius: 6px;
  --evo-pagination-item-bg-active: #e47202;
}
```

```html
<evo-pagination [evoTokens]="{ 'pagination-item-size': '2.5rem' }" … />

<!-- a paginação de uma tabela, por subárvore -->
<evo-data-table [evoTokens]="{ 'pagination-item-bg-active': '#15803d' }" … />
```

No Theme Studio aparece em **Básicos → Pagination**.

---

## Acessibilidade

- `<nav aria-label="Paginação">` com uma lista de `<button>`s nativos.
- A página actual leva `aria-current="page"`. Cada botão tem nome completo
  ("Página 3"), e as setas "Página anterior/seguinte".
- As reticências são `aria-hidden`.
- **Alvo de toque** de pelo menos 44×44px, por pseudo-elemento, sem mudar o
  tamanho visível.
- Foco visível por `--evo-focus-ring-*`. Em `forced-colors`, a página actual usa
  `Highlight`. As setas invertem em `dir="rtl"`.

---

## Migração

Não existia como componente: era a paginação embutida no
`data-tabela-generica-v2` (ver a migração em `data-table/README.md`).

| Antes                                    | Agora                                 |
| ---------------------------------------- | ------------------------------------- |
| um botão por página (500 páginas = 500)  | janela fixa com reticências           |
| números com zero à esquerda (`01`, `02`) | números simples                       |
| setas sem nome acessível                 | "Página anterior" / "Página seguinte" |
| página actual só pela cor                | `aria-current="page"`                 |
| `bg-[#E47202]`, `border-[#E2E8F0]` fixos | `--evo-pagination-item-*`             |

Para o aspecto antigo:

```css
:root {
  --evo-pagination-item-bg-active: #e47202;
  --evo-pagination-item-border-color: #e2e8f0;
  --evo-pagination-item-fg: #5c5c5c;
}
```

---

## Ficheiros

```
pagination/
├── evo-pagination.ts        componente + evoPageItems()
├── pagination.css           estilos (só var(--evo-*), sem declarar --evo-pagination-*)
├── pagination.messages.ts   textos + provideEvoPaginationMessages()
├── pagination.tokens.ts     metadados para o Theme Studio
├── pagination.preview.ts    pré-visualização no Studio
├── evo-pagination.spec.ts   testes (janela de páginas, navegação, ARIA, regra 1)
├── index.ts
└── README.md
```
