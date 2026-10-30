# EvoTabs — `<evo-tabs>`, `<evo-tab-list>`, `evoTab`, `<evo-tab-panel>`

Alterna entre vistas persistentes do mesmo ecrã, sem overlay — diferente do
`evo-menu` (executa acções) e do `evo-select` (escolhe um valor de formulário).

```
<evo-tabs>
┌───────────┬───────────┬──────────────┐
│  Tab A    │  Tab B    │  Tab C (dis.)│  ← <evo-tab-list> role="tablist"
├───────────┴───────────┴──────────────┤
│▔▔▔▔▔▔▔▔▔▔▔                            │  ← indicador sob a seleccionada
│                                       │
│  Conteúdo da tab seleccionada         │  ← <evo-tab-panel>
│                                       │
└───────────────────────────────────────┘
```

## Quando usar

Para alternar **conteúdo persistente** dentro da mesma página (definições,
separadores de um formulário). Para abrir um painel **sobreposto**, isso é o
`evo-drawer`/`evo-modal`; para **executar uma acção**, o `evo-menu`; para
**escolher um valor** de formulário, o `evo-select`.

## Importar

```ts
import { EvoTab, EvoTabList, EvoTabPanel, EvoTabs } from '@evolium-kit/toolkit/components';
```

## Exemplos

### Básico

```html
<evo-tabs [(value)]="separador" ariaLabel="Definições">
  <evo-tab-list>
    <button evoTab value="geral">Geral</button>
    <button evoTab value="facturacao">Facturação</button>
    <button evoTab value="avancado" disabled>Avançado</button>
  </evo-tab-list>

  <evo-tab-panel value="geral">
    <p>Conteúdo de "Geral".</p>
  </evo-tab-panel>
  <evo-tab-panel value="facturacao">
    <p>Conteúdo de "Facturação".</p>
  </evo-tab-panel>
  <evo-tab-panel value="avancado">
    <p>Conteúdo de "Avançado".</p>
  </evo-tab-panel>
</evo-tabs>
```

```ts
protected readonly separador = signal<'geral' | 'facturacao' | 'avancado'>('geral');
```

### Vertical, com painel a preservar estado

```html
<evo-tabs [(value)]="separador" orientation="vertical" ariaLabel="Conta">
  <evo-tab-list>
    <button evoTab value="perfil">Perfil</button>
    <button evoTab value="seguranca">Segurança</button>
  </evo-tab-list>

  <evo-tab-panel value="perfil">…</evo-tab-panel>
  <evo-tab-panel value="seguranca" keepMounted>
    <!-- um formulário a meio não se perde ao trocar de tab e voltar -->
    <form [formGroup]="formSeguranca">…</form>
  </evo-tab-panel>
</evo-tabs>
```

### Por dados

```html
<evo-tabs [(value)]="separador">
  <evo-tab-list [tabs]="secoes()" />
  @for (s of secoes(); track s.value) {
  <evo-tab-panel [value]="s.value">{{ s.label }} — conteúdo</evo-tab-panel>
  }
</evo-tabs>
```

`[tabs]` gera só os botões da lista (com `disabled`, se vier nos dados); os
painéis continuam compostos à mão — podem vir de um `@for`, como acima.

### Activação automática (o foco já selecciona)

```html
<evo-tabs [(value)]="separador" selectionFollowsFocus>…</evo-tabs>
```

## API — `<evo-tabs>` (contexto)

| Nome                    | Tipo                         | Omissão        | Forma     | Descrição                                                       |
| ----------------------- | ---------------------------- | -------------- | --------- | --------------------------------------------------------------- |
| `value`                 | `string \| number`           | `undefined`    | `model()` | Tab seleccionada. `[(value)]`.                                  |
| `orientation`           | `'horizontal' \| 'vertical'` | `'horizontal'` | `input()` | Direcção do teclado (↔/↕) e do layout.                          |
| `size`                  | `'sm' \| 'md' \| 'lg'`       | `'md'`         | `input()` | Tamanho.                                                        |
| `selectionFollowsFocus` | `boolean`                    | `false`        | `input()` | `true`: o foco já selecciona. Omissão: Enter/Espaço selecciona. |
| `ariaLabel`             | `string`                     | `''`           | `input()` | Nome acessível do `<evo-tab-list>` (`role="tablist"`).          |
| `ariaLabelledby`        | `string`                     | `''`           | `input()` | Idem, por id de um rótulo já visível.                           |

## API — `<evo-tab-list>`

| Nome               | Tipo                        | Omissão | Descrição                                                 |
| ------------------ | --------------------------- | ------- | --------------------------------------------------------- |
| `tabs`             | `EvoTabEntry[] \| null`     | `null`  | Gera os botões por dados (`{ value, label, disabled? }`). |
| `disableUnderline` | `boolean`                   | `false` | Esconde a linha completa por baixo da lista.              |
| `sticky`           | `'top' \| 'bottom' \| null` | `null`  | Fixa a lista num contentor com scroll.                    |
| `scrollable`       | `boolean`                   | `false` | Scroll (sem barra visível) quando as tabs não cabem.      |

## API — `evoTab`

Directiva/componente em `button[evoTab]`.

| Nome       | Tipo               | Omissão     | Forma              | Descrição                                             |
| ---------- | ------------------ | ----------- | ------------------ | ----------------------------------------------------- |
| `value`    | `string \| number` | obrigatório | `input.required()` | Identifica a tab.                                     |
| `disabled` | `boolean`          | `false`     | `input()`          | Tira a tab do foco e da navegação por setas (nativo). |

## API — `<evo-tab-panel>`

| Nome          | Tipo               | Omissão     | Forma              | Descrição                                                 |
| ------------- | ------------------ | ----------- | ------------------ | --------------------------------------------------------- |
| `value`       | `string \| number` | obrigatório | `input.required()` | Liga ao `evoTab` com o mesmo valor.                       |
| `keepMounted` | `boolean`          | `false`     | `input()`          | Mantém o conteúdo no DOM (só escondido) ao trocar de tab. |

## Comportamento e teclado

- **Selecção manual por omissão**: as setas só movem o foco (roving
  `tabindex`, `FocusKeyManager` do CDK); Enter ou Espaço selecciona a tab
  focada. Com `selectionFollowsFocus`, o foco já selecciona.
- Setas ←/→ (horizontal) ou ↑/↓ (vertical), com **wrap** nas pontas; **Home**/
  **End** vão para a primeira/última tab não desactivada. Só o eixo da
  orientação responde — medido assim na referência.
- Clicar numa tab selecciona-a de imediato.
- Uma tab `disabled` fica fora do foco e é **saltada** pelas setas (correcção
  face à referência — ver "Referência").
- O painel activo mostra-se (`[hidden]` sai); os outros ficam `hidden`, e por
  omissão são destruídos do DOM (`keepMounted` para preservar estado).

## Personalizar

| Token                             | Controla                             | Herda de                            |
| --------------------------------- | ------------------------------------ | ----------------------------------- |
| `--evo-tabs-gap`                  | espaço entre as tabs                 | `--evo-space-sm`                    |
| `--evo-tabs-list-border-color`    | linha completa sob/ao lado da lista  | `--evo-color-border`                |
| `--evo-tabs-indicator-color`      | cor do indicador da tab seleccionada | `--evo-color-primary`               |
| `--evo-tabs-indicator-thickness`  | espessura do indicador               | `2px`                               |
| `--evo-tabs-indicator-radius`     | cantos do indicador                  | `--evo-radius-full`                 |
| `--evo-tabs-indicator-duration`   | duração da transição do indicador    | `--evo-duration-fast`               |
| `--evo-tabs-tab-fg`               | texto de uma tab não seleccionada    | `--evo-color-on-surface-muted`      |
| `--evo-tabs-tab-fg-selected`      | texto da tab seleccionada            | `--evo-color-primary`               |
| `--evo-tabs-tab-bg-hover`         | fundo da tab em hover                | `--evo-color-primary-soft`          |
| `--evo-tabs-tab-padding-x/-y`     | espaçamento interno de cada tab      | `--evo-space-md` / `--evo-space-sm` |
| `--evo-tabs-tab-disabled-opacity` | opacidade de uma tab desactivada     | `0.5`                               |
| `--evo-tabs-panel-padding`        | espaço interno do painel activo      | `--evo-space-md`                    |

`sm`/`lg` ajustam `--evo-tabs-gap` e `--evo-tabs-tab-padding-*` em
`<evo-tab-list>`; as tabs e o painel herdam por cascata normal de CSS custom
properties (não param na fronteira de componente). No Theme Studio, o
`EvoTabs` aparece em **Básicos**.

```html
<evo-tab-list [evoTokens]="{ 'tabs-indicator-color': '#f59e0b' }">…</evo-tab-list>
```

## Acessibilidade

- `role="tablist"`/`"tab"`/`"tabpanel"`, `aria-selected`, `aria-controls`,
  `aria-labelledby` cruzados entre tab e painel, `aria-orientation`.
- Roving tabindex: só a tab activa tem `tabindex="0"`; as outras, `-1`.
- `tabindex="0"` sempre no painel, para quem navega só por teclado conseguir
  entrar no conteúdo (a referência não o põe — ver abaixo).
- Alvos de toque de pelo menos 44×44 px; anel de foco `--evo-focus-ring-*`.
- `prefers-reduced-motion` desliga a transição do indicador.

## Referência: Joy UI `Tabs`

Sem modelo em `src/app/`: construído do zero, medido ao vivo (Chrome,
claude-in-chrome) em `mui.com/joy-ui/react-tabs/`.

| Medido na Joy UI                                                                                               | Aqui                                                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Activação manual por omissão (setas só movem o foco)                                                           | igual                                                                                                       |
| Wrap nas pontas, Home/End, só um eixo por orientação                                                           | igual                                                                                                       |
| Tab desactivada (`aria-disabled`) continua alcançável pelas setas                                              | **corrigido**: saltada (roving tabindex só considera tabs activáveis)                                       |
| `role="tabpanel"` sem `tabindex`                                                                               | **acrescentado** `tabindex="0"` sempre (recomendação da APG)                                                |
| `aria-label`/`aria-labelledby` postos num `<div>` de contexto sem `role` (ficam órfãos para um leitor de ecrã) | postos directamente no `<evo-tab-list>` (`role="tablist"`), onde a especificação ARIA garante que funcionam |
| Tab só com ícone, sem texto nem `aria-label` — zero nome acessível                                             | **documentado aqui**: dar sempre `aria-label` a uma tab só-ícone (sem verificação automática)               |
| `keepMounted` por painel                                                                                       | igual (prop própria, mesmo nome)                                                                            |
| Scroll horizontal com `overflow:auto` manual no `sx`                                                           | `scrollable` no `<evo-tab-list>`, sem CSS à parte                                                           |
| `indicatorPlacement`/`underlinePlacement` configuráveis por lado                                               | **fora de âmbito**: fixo (`bottom` horizontal / `right` vertical)                                           |
| `tabFlex`, `color`+`variant` combinatórios, RTL automático                                                     | **fora de âmbito** (ver notas abaixo)                                                                       |

**Não exercitado**: RTL (setas invertidas), leitor de ecrã real, dispositivo
táctil real, `scrollable` dentro de um `evo-modal`/`evo-drawer`.

## Ficheiros

```
tabs/
├── evo-tabs.ts         <evo-tabs> — contexto (value, orientation, size…)
├── evo-tab-list.ts      <evo-tab-list> — role=tablist, FocusKeyManager
├── evo-tab.ts            evoTab — directiva em button[evoTab]
├── evo-tab-panel.ts      <evo-tab-panel>
├── tabs.types.ts         EvoTabEntry ([tabs] por dados)
├── tabs.css              estilos partilhados (só var(--evo-*))
├── tabs.tokens.ts        metadados para o Theme Studio
├── tabs.preview.ts       pré-visualização no Theme Studio
├── evo-tabs.spec.ts      testes
├── index.ts
└── README.md
```
