# EvoDataTable — `<evo-data-table>`

Tabela de dados com pesquisa, ordenação, paginação, selecção e linhas
expansíveis. Os dados podem estar em memória ou vir de uma API, página a
página, com debounce, cancelamento de pedidos obsoletos, esqueleto ao
carregar e estado de erro com "Tentar de novo".

```
╭───────────────────────────────────────────────────────────────╮ ← border-*, radius, shadow
│ [toolbar-start]              🔍 Pesquisar…  [toolbar-end]     │ ← header-bg
├───┬───┬──────────────┬────────────┬───────────────┬──────────┤
│ › │ ☐ │ Nome ▲       │ Idade ⇅    │ Cidade        │ Acções   │ ← header-bg / header-fg
├───┼───┼──────────────┼────────────┼───────────────┼──────────┤ ← row-border-*
│ › │ ☑ │ Ana          │ 27         │ Luanda        │ [Editar] │ ← row-selected-bg
│ ⌄ │ ☐ │ Bruno        │ 34         │ Benguela      │ [Editar] │ ← row-hover-bg / striped
│   detalhe (evoRowDetail)                                      │
├───────────────────────────────────────────────────────────────┤
│ [summary]                                                     │
├───────────────────────────────────────────────────────────────┤
│ [footer-start]  A mostrar 1–10 de 124   Linhas [10▾]  ‹ 1 2 › │ ← footer-bg (EvoPagination)
╰───────────────────────────────────────────────────────────────╯
 a carregar: linhas-esqueleto (skeleton-bg) · a recarregar: barra fina (progress-color)
```

Assenta no `CdkTable` (`<table>`/`<th>`/`<td>` nativos). A pesquisa é um
`EvoTextField` e a paginação um `EvoPagination`.

---

## Importar

```ts
import {
  EvoDataTable,
  EvoDataTableCell,
  EvoDataTableRowActions,
  EvoDataTableRowDetail,
  EvoDataTableColumn,
} from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoDataTable, EvoDataTableCell, EvoDataTableRowActions, EvoDataTableRowDetail],
  // …
})
```

Só se importam as directivas de template que se usam.

---

## Três formas de dar os dados

| Forma                        | Quem pesquisa, ordena e pagina | Usar quando                                                           |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `[data]` (omissão)           | a tabela, em memória           | a lista inteira já está no browser (até alguns milhares)              |
| `[source]`                   | a API, pedida pela tabela      | a API pagina; a tabela trata de pedidos, loading e erro               |
| `paging="server"` + `[data]` | a API, pedida pelo **pai**     | o pai já tem a sua forma de carregar (store, `injectCrudResource`, …) |

---

## API

### Dados

| Nome      | Tipo                               | Omissão    | Angular   | Descrição                                                                                           |
| --------- | ---------------------------------- | ---------- | --------- | --------------------------------------------------------------------------------------------------- |
| `columns` | `readonly EvoDataTableColumn<T>[]` | `[]`       | `input()` | As colunas (ver abaixo).                                                                            |
| `data`    | `readonly T[] \| null`             | `[]`       | `input()` | Em `client`, a lista completa; em `server`, só a página actual. Ignorado com `source`.              |
| `source`  | `EvoDataTableSource<T> \| null`    | `null`     | `input()` | `(query, abortSignal) => Promise \| Observable<{ items, total }>`. Implica `paging="server"`.       |
| `paging`  | `'client' \| 'server'`             | `'client'` | `input()` | Quem pesquisa/ordena/pagina.                                                                        |
| `total`   | `number \| null`                   | `null`     | `input()` | Total de registos em `server` sem `source`.                                                         |
| `ssr`     | `boolean`                          | `false`    | `input()` | Com `source`, pedir também no render do servidor (sem transferência de estado, repetia no browser). |

### Navegação

| Nome                | Tipo                              | Omissão     | Angular   | Descrição                                                                         |
| ------------------- | --------------------------------- | ----------- | --------- | --------------------------------------------------------------------------------- |
| `page`              | `number`                          | `1`         | `model()` | Página actual. `[(page)]`. Nunca fica numa página vazia quando os dados encolhem. |
| `pageSize`          | `number`                          | `10`        | `model()` | Linhas por página. `[(pageSize)]`.                                                |
| `pageSizeOptions`   | `readonly number[]`               | `[]`        | `input()` | Mostra o selector de linhas por página.                                           |
| `showSummary`       | `boolean`                         | `true`      | `input()` | "A mostrar 1–10 de 124" no rodapé.                                                |
| `search`            | `string`                          | `''`        | `model()` | Texto da pesquisa. `[(search)]`, actualizado depois do debounce.                  |
| `searchable`        | `boolean`                         | `false`     | `input()` | Caixa de pesquisa na barra de cima.                                               |
| `searchPlaceholder` | `string`                          | `''`        | `input()` | Por omissão, "Pesquisar…".                                                        |
| `searchDebounce`    | `number`                          | `0` / `300` | `input()` | Em ms. Por omissão, 0 no cliente e 300 no servidor.                               |
| `searchFn`          | `EvoDataTableSearchFn<T> \| null` | `null`      | `input()` | Pesquisa no cliente. Por omissão, no texto de cada coluna, sem acentos.           |
| `sort`              | `EvoDataTableSort \| null`        | `null`      | `model()` | `{ key, direction }`. `[(sort)]`. O cabeçalho alterna asc → desc → nada.          |

Pesquisar, ordenar ou mudar o tamanho volta à página 1.

### Linhas

| Nome           | Tipo                                     | Omissão | Angular   | Descrição                                                                                 |
| -------------- | ---------------------------------------- | ------- | --------- | ----------------------------------------------------------------------------------------- |
| `rowKey`       | `keyof T \| (row: T) => unknown \| null` | `null`  | `input()` | Identidade da linha (`track`, selecção, expansão). Por omissão `row.id`, senão o objecto. |
| `rowClickable` | `boolean \| (row: T) => boolean`         | `false` | `input()` | Linhas que respondem ao clique e a Enter/Espaço.                                          |
| `selectable`   | `boolean`                                | `false` | `input()` | Coluna de caixas de selecção + "seleccionar página" no cabeçalho.                         |
| `selection`    | `readonly T[]`                           | `[]`    | `model()` | Linhas seleccionadas, de qualquer página. `[(selection)]`.                                |

### Estado e aspecto

| Nome           | Tipo             | Omissão | Angular   | Descrição                                                 |
| -------------- | ---------------- | ------- | --------- | --------------------------------------------------------- |
| `loading`      | `boolean`        | `false` | `input()` | A carregar. Com `source`, automático.                     |
| `error`        | `string \| null` | `null`  | `input()` | Erro no lugar das linhas. Com `source`, automático.       |
| `emptyText`    | `string`         | `''`    | `input()` | Texto sem registos. Por omissão, "Sem registos.".         |
| `stickyHeader` | `boolean`        | `false` | `input()` | Cabeçalho fixo ao fazer scroll; usar com `maxHeight`.     |
| `maxHeight`    | `string`         | `''`    | `input()` | Altura máxima da zona das linhas (`'28rem'`).             |
| `size`         | `EvoSize`        | `'md'`  | `input()` | Densidade: `sm` (metade do padding vertical), `md`, `lg`. |
| `caption`      | `string`         | `''`    | `input()` | Legenda da tabela para leitores de ecrã (não visível).    |
| `ariaLabel`    | `string`         | `''`    | `input()` | Alternativa ao `caption`.                                 |

### Eventos e métodos

| Nome          | Payload                         | Quando                                                                |
| ------------- | ------------------------------- | --------------------------------------------------------------------- |
| `(rowClick)`  | `T`                             | Clique, Enter ou Espaço numa linha clicável (não nos controlos dela). |
| `(rowToggle)` | `{ row: T; expanded: boolean }` | Uma linha foi expandida ou recolhida.                                 |
| `(retry)`     | `void`                          | "Tentar de novo" no estado de erro (com `source`, já repete).         |
| `reload()`    | método                          | Pede de novo a página actual à `source`.                              |

Mais os `(pageChange)`, `(pageSizeChange)`, `(searchChange)`, `(sortChange)` e
`(selectionChange)` dos `model()`.

### `EvoDataTableColumn<T>`

| Campo         | Tipo                           | Descrição                                                                        |
| ------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `key`         | campo de `T` ou texto livre    | Identifica a coluna; por omissão, o campo mostrado.                              |
| `label`       | `string`                       | Cabeçalho.                                                                       |
| `width`       | `string`                       | Largura CSS.                                                                     |
| `align`       | `'start' \| 'center' \| 'end'` | Alinhamento (números: `'end'`).                                                  |
| `cell`        | `(row, index) => string`       | Texto da célula (e da pesquisa). Por omissão, `row[key]`.                        |
| `sortable`    | `boolean`                      | Cabeçalho clicável para ordenar.                                                 |
| `sortValue`   | `(row) => unknown`             | Valor para ordenar no cliente. Números e datas como tal; texto pela ordem local. |
| `searchable`  | `boolean`                      | `false` tira a coluna da pesquisa no cliente.                                    |
| `cellClass`   | `string \| (row) => string`    | Classe(s) do `<td>`.                                                             |
| `headerClass` | `string`                       | Classe(s) do `<th>`.                                                             |

### Templates e slots

| Template / slot                          | Contexto                                      | Para                                       |
| ---------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `<ng-template evoCell="key">`            | `let-row`, `let-i="index"`, `let-item="item"` | Conteúdo de uma coluna.                    |
| `<ng-template evoRowActions>`            | idem                                          | Coluna de acções (a última).               |
| `<ng-template evoRowDetail>`             | idem                                          | Detalhe expansível; acrescenta a coluna ›. |
| `slot="toolbar-start"` / `"toolbar-end"` | —                                             | Barra de cima (título, filtros, botões).   |
| `slot="summary"`                         | —                                             | Linha entre a tabela e o rodapé (totais).  |
| `slot="footer-start"`                    | —                                             | Início do rodapé.                          |
| `slot="empty"` / `slot="error"`          | —                                             | Substituem os textos de vazio / erro.      |

Para o editor tipar `row`, passar a lista à directiva:
`<ng-template evoCell="estado" [evoCellOf]="facturas()" let-f>` (o mesmo com
`[evoRowActionsOf]` e `[evoRowDetailOf]`). Sem isso, `row` é `unknown`.

A barra de cima só aparece se tiver pesquisa ou algum slot. O `index` é a
posição na lista completa, não na página.

Atributos reflectidos no host: `data-evo-size`, `data-evo-loading`,
`data-evo-error`, `data-evo-sticky-header`. Em cada `<tr>`:
`data-evo-selected`, `data-evo-expanded`, `data-evo-clickable`,
`data-evo-even`, `data-evo-skeleton`.

---

## Exemplos

### Dados em memória

```ts
interface Factura { id: number; numero: string; cliente: string; valor: number; pago: boolean }

protected readonly colunas: EvoDataTableColumn<Factura>[] = [
  { key: 'numero', label: 'Número', sortable: true },
  { key: 'cliente', label: 'Cliente', sortable: true },
  { key: 'valor', label: 'Valor', align: 'end', sortable: true,
    cell: (f) => `${f.valor.toLocaleString('pt-AO')} Kz` },
  { key: 'pago', label: 'Estado' },
];
```

```html
<evo-data-table [columns]="colunas" [data]="facturas()" searchable [pageSizeOptions]="[10, 25, 50]">
  <h2 slot="toolbar-start">Facturas</h2>
  <button evoButton slot="toolbar-end" (click)="nova()">Nova factura</button>

  <ng-template evoCell="pago" [evoCellOf]="facturas()" let-f>
    <evo-badge [tone]="f.pago ? 'success' : 'warning'"
      >{{ f.pago ? 'Paga' : 'Pendente' }}</evo-badge
    >
  </ng-template>

  <ng-template evoRowActions [evoRowActionsOf]="facturas()" let-f>
    <button evoButton variant="ghost" size="sm" (click)="editar(f)">Editar</button>
  </ng-template>
</evo-data-table>
```

### Da API, pela tabela (`source`)

```ts
private readonly http = inject(HttpClient);

protected readonly carregar: EvoDataTableSource<Factura> = (q) =>
  this.http.get<EvoDataTablePage<Factura>>('/facturas', {
    params: { page: q.page, size: q.pageSize, q: q.search, sort: evoSortParam(q.sort) },
  });
```

```html
<evo-data-table #tabela [columns]="colunas" [source]="carregar" searchable />
<button evoButton (click)="tabela.reload()">Actualizar</button>
```

Se a API devolver outro formato, converter no `source`:

```ts
protected readonly carregar: EvoDataTableSource<Factura> = (q) =>
  this.http.get<RespostaSpring<Factura>>('/facturas', { params: { page: q.page - 1, size: q.pageSize } })
    .pipe(map((r) => ({ items: r.content, total: r.totalElements })));
```

Com `fetch`, passar o `abortSignal` (segundo argumento) para cancelar pedidos
obsoletos:

```ts
protected readonly carregar: EvoDataTableSource<Factura> = async (q, signal) => {
  const r = await fetch(`/api/facturas?page=${q.page}&q=${encodeURIComponent(q.search)}`, { signal });
  return r.json();
};
```

### Da API, pelo pai (`paging="server"`)

```ts
protected readonly pagina = signal(1);
protected readonly pesquisa = signal('');
protected readonly ordem = signal<EvoDataTableSort | null>(null);

protected readonly facturas = httpResource<EvoDataTablePage<Factura>>(() => ({
  url: '/facturas',
  params: { page: this.pagina(), q: this.pesquisa(), sort: evoSortParam(this.ordem()) },
}));
```

```html
<evo-data-table
  [columns]="colunas"
  paging="server"
  [data]="facturas.value()?.items"
  [total]="facturas.value()?.total"
  [loading]="facturas.isLoading()"
  [error]="facturas.error() ? 'Falhou.' : null"
  (retry)="facturas.reload()"
  [(page)]="pagina"
  [(search)]="pesquisa"
  [(sort)]="ordem"
  searchable
/>
```

### Selecção, clique e detalhe

```html
<evo-data-table
  [columns]="colunas"
  [data]="facturas()"
  selectable
  [(selection)]="seleccionadas"
  [rowClickable]="true"
  (rowClick)="abrir($event)"
>
  <span slot="toolbar-start">{{ seleccionadas().length }} seleccionadas</span>
  <ng-template evoRowDetail [evoRowDetailOf]="facturas()" let-f>
    <app-linhas-factura [factura]="f" />
  </ng-template>
</evo-data-table>
```

### Cabeçalho fixo e densidade

```html
<evo-data-table [columns]="colunas" [data]="registos()" stickyHeader maxHeight="24rem" size="sm" />
```

### Textos

```ts
provideEvoDataTableMessages({ empty: 'Ainda não há facturas.', actions: '' });
provideEvoPaginationMessages({ pageSize: 'Por página' });
```

Chaves: `searchLabel`, `searchPlaceholder`, `actions`, `empty`,
`noResults(termo)`, `error`, `retry`, `loading`, `selectRow`, `selectPage`,
`expandRow`, `resultsAnnouncement(total, pagina, paginas)`. Os textos do
rodapé são do `EvoPagination`.

---

## Personalizar

| Token                               | Controla                                   | Herda de                       |
| ----------------------------------- | ------------------------------------------ | ------------------------------ |
| `--evo-data-table-bg`               | fundo                                      | `--evo-color-surface`          |
| `--evo-data-table-border-color`     | borda externa                              | `--evo-color-border`           |
| `--evo-data-table-border-width`     | espessura da borda externa (`0` tira-a)    | `--evo-border-width`           |
| `--evo-data-table-radius`           | raio dos cantos                            | `--evo-radius-lg`              |
| `--evo-data-table-shadow`           | sombra                                     | `--evo-elevation-1`            |
| `--evo-data-table-row-border-color` | separador entre linhas (e da barra/rodapé) | `--evo-color-border`           |
| `--evo-data-table-row-border-width` | espessura do separador (`0` tira-o)        | `--evo-border-width`           |
| `--evo-data-table-row-hover-bg`     | fundo da linha em hover                    | `--evo-color-surface-sunken`   |
| `--evo-data-table-row-selected-bg`  | linha seleccionada, expandida e o detalhe  | `--evo-color-primary-soft`     |
| `--evo-data-table-row-striped-bg`   | zebra nas linhas pares                     | — (`transparent`)              |
| `--evo-data-table-cell-padding-x`   | espaçamento horizontal das células         | `--evo-space-lg`               |
| `--evo-data-table-cell-padding-y`   | espaçamento vertical (sm: ×0,5; lg: ×1,5)  | `--evo-space-md`               |
| `--evo-data-table-header-bg`        | fundo do cabeçalho e da barra de cima      | `--evo-color-surface-sunken`   |
| `--evo-data-table-header-fg`        | texto do cabeçalho                         | `--evo-color-on-surface`       |
| `--evo-data-table-footer-bg`        | fundo do rodapé                            | `--evo-color-surface-sunken`   |
| `--evo-data-table-fg`               | texto das células                          | `--evo-color-on-surface`       |
| `--evo-data-table-fg-muted`         | vazio, erro e rodapé                       | `--evo-color-on-surface-muted` |
| `--evo-data-table-skeleton-bg`      | barras do esqueleto                        | `--evo-color-border`           |
| `--evo-data-table-progress-color`   | barra fina de recarregamento               | `--evo-color-primary`          |

Herdados de outros componentes, sem token próprio: a pesquisa usa
`--evo-input-*`/`--evo-text-field-*`, o rodapé `--evo-pagination-*`, o
"Tentar de novo" `--evo-button-*`, o foco `--evo-focus-ring-*`.

### Na aplicação inteira (`styles.css`)

```css
:root {
  --evo-data-table-radius: 16px;
  --evo-data-table-row-border-color: #f0f0f0;
  --evo-data-table-row-striped-bg: #fafafa;
}
```

### Numa só tabela ou numa subárvore

```html
<!-- sem bordas nenhumas, linhas mais finas -->
<evo-data-table
  [evoTokens]="{
    'data-table-border-width': '0',
    'data-table-row-border-width': '0',
    'data-table-row-striped-bg': '#f8fafc'
  }"
  …
/>

<!-- separador grosso e colorido; a paginação desta tabela a verde -->
<section
  [evoTokens]="{ 'data-table-row-border-width': '2px', 'data-table-row-border-color': '#fed7aa', 'pagination-item-bg-active': '#15803d' }"
>
  <evo-data-table … />
</section>
```

### No Theme Studio

Aparece em **Superfícies → Data table**, com os 19 tokens no painel de
propriedades, os tamanhos `sm`/`md`/`lg` e a pré-visualização interactiva
(pesquisa, ordenação, selecção, paginação), a carregar e vazia. A paginação
tem a sua entrada em **Básicos → Pagination**.

---

## Acessibilidade

- `<table>` nativo com `<caption>` (do `caption`) ou `aria-label`.
- **Ordenação:** o cabeçalho é um `<button>`; o `<th>` leva `aria-sort`
  (`ascending`/`descending`, `none` nas ordenáveis sem ordem).
- **Selecção:** caixas nativas com nome ("Seleccionar linha", "Seleccionar
  todas as linhas da página"); a do cabeçalho fica `indeterminate` com parte.
- **Expansão:** botão com `aria-expanded` e `aria-controls` a apontar para a
  linha de detalhe.
- **Clique na linha:** as linhas clicáveis entram na ordem de tabulação
  (`tabindex="0"`) e respondem a Enter/Espaço. Põe sempre também um botão na
  linha (ex.: em `evoRowActions`) para o mesmo fim.
- **Carregar:** `aria-busy` na tabela; o esqueleto é `aria-hidden`.
- **Resultados:** o número de resultados e a página são anunciados
  (`LiveAnnouncer`) depois de pesquisar e a cada página do servidor.
- **Erro:** `role="alert"`.
- A pesquisa tem rótulo acessível (escondido) e botão de limpar.
- `prefers-reduced-motion` pára o esqueleto e a barra. `forced-colors` marca a
  linha seleccionada com `Highlight`.

---

## SSR

Com `source`, a tabela não pede nada no servidor (desenha o esqueleto) e pede
no browser, a não ser com `ssr`. Sem `crypto`/`window`: os ids vêm de um
contador de módulo, e o anúncio só corre no browser.

---

## Migração a partir de `data-tabela-generica-v2`

| Antes                                               | Agora                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `<data-tabela-generica-v2>`                         | `<evo-data-table>`                                                           |
| `[headers]`                                         | `[columns]`                                                                  |
| `header.cell(row, index)`                           | `column.cell(row, index)` (igual)                                            |
| `header.classes` / `header.cellClasses` (Tailwind)  | `headerClass` / `cellClass` (classes do projecto; cores por tokens)          |
| `[filter]="true"`                                   | `searchable`                                                                 |
| `[filtroTexto]`                                     | `[(search)]`                                                                 |
| `[carregando]` (substituía a tabela por um spinner) | `[loading]` (esqueleto dentro da tabela; a barra de cima fica)               |
| `[linhaClicavel]` + `(linhaSelecionada)`            | `[rowClickable]` + `(rowClick)` (agora também por teclado)                   |
| `[pageSize]` fixo                                   | `[(pageSize)]` + `[pageSizeOptions]`                                         |
| `paginaAtual` interno                               | `[(page)]`                                                                   |
| `[headerLeftV2]` / `[headerRightV2]`                | `slot="toolbar-start"` / `slot="toolbar-end"`                                |
| `[footerLeftV2]`                                    | `slot="footer-start"` (+ resumo automático, `showSummary`)                   |
| `[resumoV2]`                                        | `slot="summary"`                                                             |
| `*dataTabelaGenericaColV2="'key'"`                  | `<ng-template evoCell="key">` (contexto igual: `$implicit`, `item`, `index`) |
| `*dataTabelaGenericaActionsV2`                      | `<ng-template evoRowActions>`                                                |
| "Ações" / "Pesquisar..." fixos                      | `provideEvoDataTableMessages()`                                              |
| só em memória                                       | também `[source]` (API) e `paging="server"`                                  |

**Bugs do original corrigidos:**

1. Um template de coluna dentro de um `@if` que aparecia depois nunca era
   usado (o mapa só se construía em `ngAfterContentInit`). Agora é `contentChildren()`.
2. Com o `filtroTexto` externo ou dados a encolher, a tabela ficava numa
   página vazia. A página é agora sempre presa ao total.
3. A paginação desenhava um botão por página. Agora é uma janela fixa com
   reticências (`EvoPagination`).
4. `track $index` nas linhas: re-renderizava tudo ao paginar ou ordenar.
   Agora é `rowKey` (por omissão `row.id`).
5. O loading escondia a toolbar e a pesquisa, e usava uma classe Tailwind
   inexistente (`border-brand-orange-500`).
6. Sem estado vazio. A pesquisa e os botões de página não tinham nome acessível,
   as linhas clicáveis não funcionavam por teclado, e faltava `aria-current`.
7. A pesquisa chamava `cell()` sem o índice, por isso filtrava um texto
   diferente do que mostrava.
8. Faltava `OnPush`; usava `@Input`/`@ContentChild` decoradores, `any` nos
   templates e `CommonModule`.

Removido: `min-w-175` (largura mínima fixa; a tabela faz scroll horizontal
sozinha quando não cabe) e o zero à esquerda nas páginas (`01`).

Para o aspecto antigo (laranja, cantos grandes):

```css
:root {
  --evo-data-table-radius: 16px;
  --evo-data-table-border-color: #f5e1d8;
  --evo-data-table-header-bg: #fdf2ea;
  --evo-data-table-header-fg: #1f1f1f;
  --evo-data-table-fg: #3a3a3a;
  --evo-data-table-row-border-color: #f0f0f0;
  --evo-data-table-row-hover-bg: #fdf9f6;
  --evo-data-table-footer-bg: #fdf9f6;
  --evo-pagination-item-bg-active: #e47202;
  --evo-pagination-item-border-color: #e2e8f0;
}
```

---

## Ficheiros

```
data-table/
├── evo-data-table.ts          componente (CdkTable, cliente/servidor/source)
├── data-table.types.ts        colunas, query, página, source, evoSortParam()
├── data-table.directives.ts   evoCell, evoRowActions, evoRowDetail
├── data-table.messages.ts     textos + provideEvoDataTableMessages()
├── data-table.css             estilos (só var(--evo-*), sem declarar --evo-data-table-*)
├── data-table.tokens.ts       metadados para o Theme Studio
├── data-table.preview.ts      pré-visualização no Studio
├── evo-data-table.spec.ts     testes (cliente, source, ARIA, teclado, regra 1)
├── index.ts
└── README.md
```

As regras que dependem de conteúdo projectado (esconder a barra vazia, slots
`empty`/`error`) vivem em `styles/evolium-components.css`.
