# EvoSelect — `<evo-select>`

Lista de escolha numa só tag: etiqueta, gatilho, painel com pesquisa, grupos,
ícones e template por opção, ajuda e mensagem de erro. Escolha simples ou
múltipla. Funciona com `formControlName`, `[formControl]`, `[(ngModel)]` ou
sozinho com `[(value)]`, e mostra o erro do controlo **sem configuração**.

É composto pelo `EvoField` (disposição e etiqueta) e pelo aspecto do
`EvoInput` (o gatilho usa a classe `evo-input`), por isso afinar
`--evo-input-*` ou `--evo-field-*` afina também este componente. O painel é um
overlay do `@angular/cdk` em modo **popover inline**: fica na top layer (nunca
é cortado por `overflow: hidden`, abre para cima quando não cabe por baixo) e
continua dentro do `<evo-select>` no DOM, por isso herda os `[evoTokens]`.

```
 Província *                              ← label · * = obrigatório (required-fg)
╭───────────────────────────────────╮
│ Luanda                    ×  ⟳  ⌄ │     ← valor · limpar · loading · seta (icon-fg / icon-size)
╰───────────────────────────────────╯       gatilho = --evo-input-*
╭───────────────────────────────────╮  ← painel: panel-bg / panel-border-color / panel-radius
│ 🔍 Pesquisar…                     │     pesquisa fixa (não faz scroll)
│ ───────────────────────────────── │
│ Seleccionar todos               ✓ │     só com multiple + selectAll
│ LITORAL                           │     cabeçalho de grupo (group-label-fg)
│ Luanda                          ✓ │     escolhida: option-selected-fg / -bg · ✓ = check-fg
│   Capital                         │     sublabel (sublabel-fg)
│ Bengo                             │     activa (rato/teclado): option-hover-bg
╰───────────────────────────────────╯     altura máx. = panel-max-height
 Onde fica a sede.                        ← hint (ou erro)
```

| Estado      | Gatilho                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| normal      | borda `--evo-input-border-color`                                          |
| foco/aberto | borda `focus-border-color` + anel `focus-ring-color`                      |
| erro        | borda `--evo-color-danger` + anel `error-ring-color`, mensagem a vermelho |
| desactivado | fundo `disabled-bg`, 50% de opacidade, fora da ordem de Tab               |

---

## Importar

```ts
import { EvoSelect, EvoSelectOption } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoSelect, ReactiveFormsModule],
  // …
})
```

Para templates de opção, importar também `EvoSelectOptionDef`. O componente
usa `@angular/cdk` (overlay e a11y), que já é `peerDependency` da toolkit.

---

## API

### Inputs e model

| Nome            | Tipo                                            | Omissão                  | Angular   | Descrição                                                                                                                    |
| --------------- | ----------------------------------------------- | ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `value`         | `V \| V[] \| null`                              | `null`                   | `model()` | `[(value)]` sem formulários. O tipo vem do signal ligado (`signal<number \| null>`, `signal<string[]>`…).                    |
| `options`       | `EvoSelectOption<V, D>[]`                       | `[]`                     | `input()` | As opções (ver abaixo).                                                                                                      |
| `label`         | `string`                                        | `''`                     | `input()` | Etiqueta. Um clique nela foca o gatilho.                                                                                     |
| `hideLabel`     | `boolean`                                       | `false`                  | `input()` | Esconde a etiqueta visualmente; continua a ser lida pelos leitores de ecrã.                                                  |
| `hint`          | `string`                                        | `''`                     | `input()` | Texto de ajuda por baixo. Dá lugar à mensagem de erro, quando há uma.                                                        |
| `error`         | `string \| null \| (control) => string \| null` | `null`                   | `input()` | Erro manual, com prioridade sobre o automático. A função recebe o `AbstractControl` (ou `null`).                             |
| `errorMessages` | `Record<string, string \| (detalhe) => string>` | `null`                   | `input()` | Mensagens por chave de erro, só para este campo.                                                                             |
| `placeholder`   | `string`                                        | `'Seleccione…'`          | `input()` | Texto sem nada escolhido. A omissão vem de `provideEvoSelectMessages()`.                                                     |
| `size`          | `'sm' \| 'md' \| 'lg'`                          | `'md'`                   | `input()` | Os mesmos tamanhos do `evoInput`; o painel acompanha o tamanho de letra.                                                     |
| `required`      | `boolean \| undefined`                          | —                        | `input()` | Por omissão lido do controlo (`Validators.required`). `true`/`false` força.                                                  |
| `optional`      | `boolean`                                       | `false`                  | `input()` | Mostra "(opcional)". Ignorado se o campo for obrigatório.                                                                    |
| `disabled`      | `boolean`                                       | `false`                  | `input()` | Também desactivado por `control.disable()`.                                                                                  |
| `multiple`      | `boolean`                                       | `false`                  | `input()` | O valor passa a ser um array; o painel não fecha ao escolher.                                                                |
| `searchable`    | `boolean`                                       | `false`                  | `input()` | Caixa de pesquisa no topo do painel, fixa enquanto a lista faz scroll. Escrever no gatilho abre e começa a pesquisa.         |
| `searchFn`      | `(opcao, termo) => boolean \| null`             | `evoSelectDefaultSearch` | `input()` | Filtro local. A omissão procura no `label` e no `sublabel`, sem distinguir acentos. `null` desliga-o (pesquisa no servidor). |
| `clearable`     | `boolean`                                       | `false`                  | `input()` | Botão × para apagar a escolha (`null`, ou `[]` com `multiple`).                                                              |
| `loading`       | `boolean`                                       | `false`                  | `input()` | Indicador no gatilho, `aria-busy`, e "A carregar…" no painel vazio.                                                          |
| `selectAll`     | `boolean`                                       | `false`                  | `input()` | Com `multiple`: linha "Seleccionar todos" sobre as opções **visíveis** (respeita a pesquisa). Carregar de novo desmarca-as.  |
| `maxLabels`     | `number`                                        | —                        | `input()` | Com `multiple`: acima deste número de escolhas, o gatilho mostra "N seleccionados".                                          |
| `compareWith`   | `(a: V, b: V) => boolean`                       | `Object.is`              | `input()` | Igualdade entre valores. Para objectos vindos da API, comparar pelo id.                                                      |

### Outputs

| Nome           | Payload   | Quando                                                     |
| -------------- | --------- | ---------------------------------------------------------- |
| `valueChange`  | o valor   | a cada escolha (vem do `model()`).                         |
| `searchChange` | `string`  | a cada tecla na pesquisa, e `''` ao fechar se havia texto. |
| `openedChange` | `boolean` | `true` ao abrir o painel, `false` ao fechar.               |

### `EvoSelectOption<V, D>`

| Campo       | Tipo      | Descrição                                                                                                                                        |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`     | `V`       | Qualquer tipo — **não** é convertido para string. Números chegam ao formulário como números.                                                     |
| `label`     | `string`  | Texto da opção, e o que a pesquisa e o typeahead procuram.                                                                                       |
| `sublabel`  | `string`  | Segunda linha, mais discreta. Também entra na pesquisa.                                                                                          |
| `icon`      | `string`  | Um URL/caminho de imagem (`https://`, `/`, `./`, `data:image`, ou `.png`/`.svg`/…) dá `<img alt="">`; outro texto dá um `<span>` com esse texto. |
| `iconClass` | `string`  | Classe(s) do ícone. Para fontes por ligadura: `'material-icons'` (a fonte é do projecto, a toolkit não a traz).                                  |
| `group`     | `string`  | Opções com o mesmo `group` ficam sob um cabeçalho, pela ordem em que o grupo aparece.                                                            |
| `disabled`  | `boolean` | Visível mas não escolhível; o teclado salta-a.                                                                                                   |
| `data`      | `D`       | Dados livres, para templates personalizados.                                                                                                     |

Atributos que o host reflecte, para CSS do projecto ou testes:

| Atributo              | Quando                                                    |
| --------------------- | --------------------------------------------------------- |
| `data-evo-size`       | sempre (`sm`/`md`/`lg`)                                   |
| `data-evo-open`       | painel aberto                                             |
| `data-evo-multiple`   | `multiple`                                                |
| `data-evo-invalid`    | há mensagem de erro                                       |
| `data-evo-disabled`   | desactivado, pelo input `disabled` **ou** pelo formulário |
| `data-evo-loading`    | `loading`                                                 |
| `data-evo-hide-label` | `hideLabel`                                               |

---

## Exemplos

### Reactive Forms

```ts
@Component({
  imports: [EvoSelect, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <evo-select
        formControlName="provincia"
        label="Província"
        [options]="provincias"
        searchable
        clearable
      />
    </form>
  `,
})
export class Exemplo {
  protected readonly provincias: EvoSelectOption<number>[] = [
    { value: 1, label: 'Luanda', sublabel: 'Capital' },
    { value: 2, label: 'Benguela' },
    { value: 3, label: 'Malanje', disabled: true },
  ];
  protected readonly form = inject(NonNullableFormBuilder).group({
    provincia: [null as number | null, Validators.required],
  });
}
```

`Validators.required` mostra o asterisco e `aria-required`. O erro aparece
depois de o controlo ficar `touched` — ao fechar o painel, ou ao sair do
gatilho fechado — com as mensagens partilhadas com o `evo-text-field`.

### Sozinho, com `[(value)]`

```html
<evo-select label="Estado" [options]="estados" [(value)]="estado" />
```

```ts
protected readonly estado = signal<string | null>('pago');
```

### Escolha múltipla

```html
<evo-select
  formControlName="provincias"
  label="Províncias de actuação"
  [options]="provincias"
  multiple
  searchable
  selectAll
  [maxLabels]="3"
/>
```

O valor do controlo é um array dos `value` escolhidos, pela ordem em que foram
escolhidos.

### Grupos, ícones e segunda linha

```ts
readonly bancos: EvoSelectOption<string>[] = [
  { value: 'bai', label: 'Banco BAI', group: 'Privados', icon: '/assets/bancos/bai.svg' },
  { value: 'bpc', label: 'BPC', sublabel: 'Banco de Poupança e Crédito', group: 'Públicos' },
  { value: 'pix', label: 'Multicaixa', icon: 'payments', iconClass: 'material-icons' },
];
```

### Objectos como valor

```html
<evo-select formControlName="gestor" [options]="gestores" [compareWith]="mesmoId" label="Gestor" />
```

```ts
readonly mesmoId = (a: { id: number } | null, b: { id: number } | null) => a?.id === b?.id;
```

### Template por opção

```html
<evo-select formControlName="gestor" [options]="gestores" label="Gestor">
  <ng-template [evoSelectOption]="gestores" let-gestor let-marcado="selected">
    <span class="avatar">{{ gestor.data?.iniciais }}</span>
    {{ gestor.label }} @if (marcado) { <strong>✓</strong> }
  </ng-template>
</evo-select>
```

O template substitui **todo** o conteúdo da opção (ícone, texto e visto); o
`role="option"`, o `aria-selected` e o destaque continuam a cargo do
componente. Passar as opções a `[evoSelectOption]` é opcional e só serve para
o editor inferir o tipo de `gestor`. O `<ng-template #optionTemplate>` do
`field-select-v2` também é aceite, sem `EvoSelectOptionDef`.

### Pesquisa no servidor

```html
<evo-select
  label="Cliente"
  [options]="clientes()"
  [loading]="aPesquisar()"
  [searchFn]="null"
  (searchChange)="pesquisar($event)"
  searchable
  formControlName="cliente"
/>
```

`[searchFn]="null"` desliga o filtro local: as opções que chegam são as que se
mostram. O debounce é de quem consome (ex.: `setTimeout` ou `debounceTime`).

### Mensagens

```ts
// app.config.ts
providers: [
  provideEvoSelectMessages({ placeholder: 'Escolha…', noResults: 'Sem resultados' }),
  // os erros são os do text-field, para todos os campos de uma vez:
  provideEvoTextFieldMessages({ errors: { required: 'Obrigatório.' } }),
];
```

Textos sobreponíveis: `placeholder`, `searchPlaceholder`, `searchLabel`,
`noResults`, `loading`, `optional`, `clear`, `selectAll`, `selectedCount(n)`.

---

## Personalizar

O gatilho não tem tokens de caixa próprios: herda os `--evo-input-*`
(fundo, borda, raio, altura, padding, cor e tamanho do texto) e a etiqueta e
a mensagem herdam os `--evo-field-*`. Os tokens de **estado** caem primeiro no
equivalente do text-field, e só depois no semântico — afinar o text-field
afina também o select, e o select pode ser afinado à parte.

| Token                                | Controla                                      | Herda de                                                        |
| ------------------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| `--evo-select-focus-border-color`    | borda com foco / aberto                       | `--evo-text-field-focus-border-color` → `--evo-color-primary`   |
| `--evo-select-focus-ring-color`      | anel de foco                                  | `--evo-text-field-focus-ring-color` → `--evo-focus-ring-color`  |
| `--evo-select-error-ring-color`      | anel de erro                                  | `--evo-text-field-error-ring-color` → `--evo-color-danger-soft` |
| `--evo-select-ring-width`            | espessura dos anéis                           | `--evo-text-field-ring-width` → `--evo-focus-ring-width`        |
| `--evo-select-ring-offset`           | afastamento dos anéis                         | `--evo-text-field-ring-offset` → `0`                            |
| `--evo-select-disabled-bg`           | fundo desactivado                             | `--evo-text-field-disabled-bg` → `--evo-color-surface-sunken`   |
| `--evo-select-placeholder-fg`        | cor do placeholder                            | `--evo-color-on-surface-muted`                                  |
| `--evo-select-optional-fg`           | cor do "(opcional)"                           | `--evo-text-field-optional-fg` → `--evo-color-on-surface-muted` |
| `--evo-select-required-fg`           | cor do asterisco                              | `--evo-text-field-required-fg` → `--evo-color-danger`           |
| `--evo-select-panel-bg`              | fundo do painel                               | `--evo-color-surface-raised`                                    |
| `--evo-select-panel-border-color`    | borda do painel e divisórias                  | `--evo-color-border`                                            |
| `--evo-select-panel-radius`          | raio do painel                                | `--evo-radius-md`                                               |
| `--evo-select-panel-shadow`          | sombra do painel                              | — (`0 8px 24px` com 16% de `--evo-color-on-surface`)            |
| `--evo-select-panel-max-height`      | altura máxima do painel                       | — (`18rem`)                                                     |
| `--evo-select-panel-offset`          | distância ao gatilho                          | `--evo-space-xs`                                                |
| `--evo-select-panel-padding`         | espaço interior do painel                     | `--evo-space-xs`                                                |
| `--evo-select-option-hover-bg`       | fundo da opção activa (rato ou teclado)       | `--evo-color-surface-sunken`                                    |
| `--evo-select-option-selected-fg`    | texto da opção escolhida                      | `--evo-color-primary`                                           |
| `--evo-select-option-selected-bg`    | fundo da opção escolhida                      | `--evo-color-primary-soft`                                      |
| `--evo-select-option-padding-block`  | espaço vertical das opções                    | `--evo-space-sm`                                                |
| `--evo-select-option-padding-inline` | espaço horizontal das opções                  | `--evo-space-sm`                                                |
| `--evo-select-icon-fg`               | seta, × e indicador                           | `--evo-text-field-icon-fg` → `--evo-color-on-surface-muted`     |
| `--evo-select-icon-size`             | seta, ×, indicador, ícones e visto das opções | `--evo-text-field-icon-size` → `1.125rem`                       |
| `--evo-select-check-fg`              | cor do visto                                  | `--evo-color-primary`                                           |
| `--evo-select-group-label-fg`        | cabeçalhos de grupo                           | `--evo-color-on-surface-muted`                                  |
| `--evo-select-sublabel-fg`           | segunda linha das opções                      | `--evo-color-on-surface-muted`                                  |

Não existe token semântico de sombra na toolkit; a omissão de
`panel-shadow` vive no fallback do `var()`, derivada da cor do texto (por
isso também funciona no tema escuro).

### Na aplicação inteira (`styles.css`)

```css
:root {
  --evo-select-panel-max-height: 24rem;
  --evo-select-option-selected-bg: transparent; /* só o visto e a cor marcam a escolha */
}
```

### Numa só instância ou numa subárvore

```html
<evo-select
  [options]="provincias"
  label="Província"
  [evoTokens]="{ 'select-panel-bg': '#fff7ed', 'select-option-selected-fg': '#9a3412' }"
/>

<section [evoTokens]="{ 'select-option-padding-block': '4px', 'select-panel-radius': '4px' }">
  <!-- todos os evo-select aqui dentro ficam compactos -->
</section>

<!-- sem fundo (o antigo bgTransparent) -->
<evo-select [options]="opcoes" [evoTokens]="{ 'input-bg': 'transparent' }" />
```

Os `[evoTokens]` chegam ao painel porque ele fica dentro do `<evo-select>` no
DOM (popover inline). Em browsers **sem** Popover API (anteriores a 2024), o
CDK põe o painel no contentor global de overlays: aí os tokens de `:root`
continuam a aplicar-se, mas os de `[evoTokens]` não chegam ao painel.

### No Theme Studio

O Select aparece em **Formulário → Select**, com os 26 tokens acima no painel
de propriedades e a pré-visualização dos estados (escolhido, pesquisa,
múltiplo com resumo, erro, a carregar, desactivado). Os metadados vivem em
`select.tokens.ts`.

---

## Acessibilidade

- Padrão **combobox + listbox** da APG: o gatilho é `role="combobox"` com
  `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`,
  `aria-labelledby` (a etiqueta) e `aria-activedescendant`; cada opção é
  `role="option"` com `aria-selected`; com `multiple`, o listbox é
  `aria-multiselectable`; grupos são `role="group"` com o nome como rótulo.
- **O foco nunca sai** do gatilho (ou da pesquisa): a opção destacada é
  anunciada por `aria-activedescendant`, via `ActiveDescendantKeyManager` do CDK.
- **Teclado:** Seta abaixo/acima, Enter, Espaço, Home/End abrem; com o painel
  aberto, setas, Home/End e PageUp/PageDown movem (dando a volta e saltando as
  desactivadas), Enter/Espaço escolhem, Escape e Alt+Seta acima fecham e
  devolvem o foco, Tab fecha. Sem pesquisa, escrever letras salta para a opção
  (typeahead); com pesquisa, escrever no gatilho abre e começa a pesquisar.
- Erro e ajuda numa região `aria-live` sempre presente, ligada por
  `aria-describedby`; `aria-invalid`, `aria-required` e `aria-busy` por binding.
- **Foco visível** na caixa inteira com `--evo-select-focus-ring-*`; o botão ×
  tem o seu próprio anel e alvo de toque de 44×44 px.
- Imagens com `alt=""` e ícones, seta e visto com `aria-hidden`: o nome da
  opção é o `label`.
- `prefers-reduced-motion` desliga a rotação da seta e abranda o indicador; em
  `forced-colors` a opção activa ganha contorno `Highlight`.
- **SSR:** IDs por contador de módulo (não `crypto`), nada de `window`/`document`
  — o painel só existe no browser, depois de uma interacção.

---

## Migração a partir de `field-select-v2`

Este componente começou como `FormFieldSelectComponentV2` (`<field-select-v2>`),
estilizado com Tailwind. Mudanças:

| Antes                                                                        | Agora                                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `FormFieldSelectComponentV2`, `<field-select-v2>`                            | `EvoSelect`, `<evo-select>`                                                           |
| `SelectOptionV2` (`value: string`)                                           | `EvoSelectOption<V, D>` (`value` de qualquer tipo)                                    |
| valor convertido com `String()`: `3` voltava como `'3'`                      | o valor é entregue tal como está na opção; `compareWith` para objectos                |
| `[erro]` com `(form: FormGroup) => …`                                        | `[error]` com `(control: AbstractControl) => …`; ou nada: erro automático do controlo |
| `[temError]="false"`                                                         | removido — a mensagem só ocupa espaço quando existe                                   |
| `[bgTransparent]`                                                            | `[evoTokens]="{ 'input-bg': 'transparent' }"`                                         |
| `[dataCy]="'x'"`                                                             | `data-cy="x"` no próprio `<evo-select>`                                               |
| `#optionTemplate` (`@ContentChild`)                                          | `<ng-template evoSelectOption>` tipado; `#optionTemplate` continua aceite             |
| `icon` sempre como Material Icons                                            | `icon` + `iconClass: 'material-icons'` (a fonte é do projecto)                        |
| `sublabel` declarado mas nunca desenhado                                     | desenhado numa segunda linha                                                          |
| painel `absolute z-100` (cortado por `overflow: hidden`)                     | overlay do CDK em popover: nunca cortado, abre para cima se não couber                |
| `document:click` por instância; fechar fora não marcava touched              | CDK outside click; `touched` ao fechar, sempre                                        |
| sem teclado; só `aria-expanded`                                              | combobox/listbox completos (ver Acessibilidade)                                       |
| `crypto.randomUUID()` (não SSR-safe, id nunca usado)                         | contador de módulo; etiqueta ligada por `aria-labelledby`                             |
| "Selecione…", "Pesquisar...", "(opcional)", "Nenhuma opção encontrada" fixos | `provideEvoSelectMessages()`                                                          |
| pesquisa sensível a acentos; texto não limpo ao fechar                       | sem acentos, também no `sublabel`; limpa ao fechar                                    |
| laranja `brand-orange-*`, cinzas `#585959`/`#9A9A9A` fixos                   | tokens; por omissão, primário e `on-surface-muted`                                    |

Para manter o laranja antigo em toda a aplicação:

```css
:root {
  --evo-select-focus-border-color: #e05319;
  --evo-select-option-selected-fg: #c2410c;
  --evo-select-option-selected-bg: transparent;
  --evo-select-check-fg: #c2410c;
  --evo-input-border-color-hover: #e05319;
}
```

---

## Ficheiros

```
select/
├── evo-select.ts          componente + ControlValueAccessor (pelo NgControl)
├── select-option.ts       EvoSelectOption, EvoSelectOptionDef, pesquisa por omissão
├── select-item.ts         linha navegável para o ActiveDescendantKeyManager (interno)
├── select.messages.ts     EVO_SELECT_MESSAGES + provideEvoSelectMessages()
├── select.css             estilos (só var(--evo-*), sem declarar --evo-select-*)
├── select.tokens.ts       metadados para o Theme Studio (26 tokens)
├── select.preview.ts      pré-visualização no Theme Studio
├── evo-select.spec.ts     testes (teclado, ARIA, formulários, pesquisa, regra 1 do CSS)
├── index.ts
└── README.md
```
