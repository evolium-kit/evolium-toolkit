# EvoMenu — `<evo-menu>`

Menu de acções: um gatilho (um botão, um item, uma área) abre um painel de itens
com teclado completo. Tem submenus, caixas de verificação, escolha única com
grupos, separadores, ícones e atalhos, ligações, barra de menus de aplicação e
menu de contexto (botão direito). O conteúdo escreve-se em HTML ou passa-se por
dados. É feito sobre o `CdkMenu` do `@angular/cdk`, que trata do teclado
(setas, Home/End, escrita rápida), da devolução do foco e dos submenus.

Não é um `evo-select`: o menu **faz** alguma coisa ao ser escolhido (`activated`),
o select **guarda** um valor.

```
 [ Dashboard ]                          ← gatilho: o botão que o utilizador já tem
╭──────────────────────────╮            ← painel: menu-bg · menu-border-color · menu-radius · menu-shadow
│ ⊖  Menor            ⌘ −  │            ← item (menu-item-fg) · ícone (slot prefix) · atalho (slot suffix)
│ ⊕  Maior            ⌘ +  │            ← item em foco/rato: menu-item-hover-bg
│ ──────────────────────── │            ← separador: menu-separator-color
│ ✓  Grelha                │            ← caixa de verificação
│ TAMANHO                  │            ← cabeçalho do grupo: menu-group-label-fg
│ ●  Médio                 │            ← escolha única
│ Início  (actual)         │            ← selected: menu-item-selected-bg / -fg
│ Mais                   › │            ← submenu
╰──────────────────────────╯
 largura mínima: menu-min-width · respiro: menu-padding · itens: menu-item-padding-*
```

---

## Importar

```ts
import {
  EvoMenu,
  EvoMenuItem,
  EvoMenuTrigger,
  // conforme precisares:
  EvoMenuCheckbox,
  EvoMenuRadio,
  EvoMenuGroup,
  EvoMenuSeparator,
  EvoMenuBar,
  EvoContextMenuTrigger,
} from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoMenu, EvoMenuItem, EvoMenuTrigger],
  // …
})
```

O componente depende de `@angular/cdk` (peer dependency da toolkit). Os ícones e
os atalhos dos itens estilizam-se na folha global — importar
`@evolium-kit/toolkit/styles/evolium-components.css`, como para os outros
componentes que são directivas.

---

## API

### Gatilho — `[evoMenuTriggerFor]`

Aplica-se a qualquer elemento (um `button[evoButton]`, um item de outro menu,
uma entrada da barra). Anuncia `aria-haspopup="menu"` e `aria-expanded`.

| Nome                | Tipo                                    | Omissão                                     | Angular    | Descrição                                                                                                                          |
| ------------------- | --------------------------------------- | ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `evoMenuTriggerFor` | `TemplateRef \| EvoMenuEntry[] \| null` | —                                           | `input()`  | O `<ng-template>` com um `<evo-menu>`, ou a lista de entradas (ver "Por dados"). `null` desliga o menu.                            |
| `evoMenuPlacement`  | `EvoMenuPlacement \| null`              | `bottom-start`; num submenu/barra, o do CDK | `input()`  | `bottom` · `top` · `left` · `right`, cada um com `-start`/`-end` (ou sem sufixo: centrado). Vira para o lado oposto se não couber. |
| `evoMenuOffset`     | `number`                                | `4`                                         | `input()`  | Distância, em px, entre o gatilho e o painel.                                                                                      |
| `evoMenuOpen`       | `boolean`                               | `false`                                     | `model()`  | Menu aberto. Suporta `[(evoMenuOpen)]`. Aberto por código, o foco vai para o 1.º item.                                             |
| `evoMenuOpened`     | `void`                                  | —                                           | `output()` | O menu abriu.                                                                                                                      |
| `evoMenuClosed`     | `void`                                  | —                                           | `output()` | O menu fechou (escolha, Escape, clique fora, Tab ou `evoMenuOpen = false`).                                                        |

Com `exportAs`, o gatilho expõe `open()`, `close()` e `toggle()`:
`<button [evoMenuTriggerFor]="m" #g="evoMenuTrigger" (click)="g.toggle()">`.

### Painel — `<evo-menu>`

Vai **dentro de um `<ng-template>`**: o gatilho desenha-o ao abrir. Os itens têm
de ser filhos directos do `<evo-menu>` (é assim que o CDK os encontra; não
funciona se vierem de um template ou componente à parte).

| Nome   | Tipo                   | Omissão                                  | Angular   | Descrição                                      |
| ------ | ---------------------- | ---------------------------------------- | --------- | ---------------------------------------------- |
| `size` | `'sm' \| 'md' \| 'lg'` | `md`; num submenu, o do menu que o abriu | `input()` | Tamanho: altera o respiro dos itens e o texto. |
| `id`   | `string`               | gerado                                   | `input()` | `id` do painel.                                |

Fora de um gatilho, é um menu **embutido** na página (um menu lateral, por
exemplo), com o mesmo teclado.

### Itens

| Elemento                                 | Para quê                           | Inputs                                                       | Eventos         |
| ---------------------------------------- | ---------------------------------- | ------------------------------------------------------------ | --------------- |
| `button[evoMenuItem]` / `a[evoMenuItem]` | acção, ligação ou submenu          | `disabled`, `selected`, `typeaheadLabel`, `closeOnSelect`    | `(activated)`   |
| `button[evoMenuCheckbox]`                | caixa de verificação               | `[(checked)]`, `disabled`, `typeaheadLabel`, `closeOnSelect` | `(activated)`   |
| `button[evoMenuRadio]`                   | escolha única (dentro de um grupo) | `value`, `disabled`, `typeaheadLabel`, `closeOnSelect`       | `(activated)`   |
| `<evo-menu-group>`                       | grupo, com cabeçalho               | `label`, `[(value)]` (o `value` do `evoMenuRadio` escolhido) | `(valueChange)` |
| `hr[evoMenuSeparator]`                   | separador                          | —                                                            | —               |

| Nome             | Tipo      | Omissão | Descrição                                                                                                                                         |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`       | `boolean` | `false` | O item fica **focável**, com `aria-disabled` (como no padrão ARIA e no CDK): o leitor de ecrã encontra-o. Não emite `activated` nem fecha o menu. |
| `selected`       | `boolean` | `false` | O item que corresponde ao sítio onde estás: `aria-current="true"` e `data-evo-selected`.                                                          |
| `closeOnSelect`  | `boolean` | `true`  | Com `false`, activar o item deixa o menu aberto (marcar várias caixas seguidas).                                                                  |
| `typeaheadLabel` | `string`  | o texto | Texto para a escrita rápida, se for diferente do que se vê.                                                                                       |
| `activated`      | `void`    | —       | O item foi activado (clique, Enter ou Espaço). Num item desactivado não emite.                                                                    |

Conteúdo projectado de um item: `slot="prefix"` (ícone, antes do texto) e
`slot="suffix"` (atalho ou texto secundário, à direita).

### Barra de menus — `<evo-menu-bar>`

`role="menubar"`. As entradas são `button[evoMenuItem]` com `[evoMenuTriggerFor]`.
Leva `aria-label` (ou `aria-labelledby`) para ter nome.

### Menu de contexto — `[evoContextMenuTriggerFor]`

| Nome                       | Tipo                                    | Omissão | Descrição                                                                   |
| -------------------------- | --------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `evoContextMenuTriggerFor` | `TemplateRef \| EvoMenuEntry[] \| null` | —       | O menu a abrir com o botão direito (ou a tecla de menu), junto ao ponteiro. |
| `evoContextMenuDisabled`   | `boolean`                               | `false` | Deixa o menu nativo do navegador em paz.                                    |

### Por dados — `EvoMenuEntry`

Em vez do `<ng-template>`, o gatilho aceita uma lista. O estado é **teu**: o menu
mostra o que lhe passas e devolve as escolhas por `run`.

| Entrada                                       | Campos                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `{ label, … }` (acção)                        | `label`, `run?()`, `selected?`, `disabled?`, `href?` (vira ligação), `iconClass?`, `suffix?`, `typeaheadLabel?`, `children?` (submenu) |
| `{ type: 'checkbox', label, checked }`        | `run?(checked)`, `disabled?` — não fecha o menu                                                                                        |
| `{ type: 'group', label?, value?, children }` | `run?(value)`; os `children` são acções, caixas, separadores ou `{ type: 'radio', label, value, disabled? }`                           |
| `{ type: 'separator' }`                       | —                                                                                                                                      |

Os submenus nascem de `children` e podem ter outros `children`; os grupos têm um
nível.

### Atributos que o host reflecte

| Atributo            | Em quê                            | Quando                       |
| ------------------- | --------------------------------- | ---------------------------- |
| `data-evo-size`     | `evo-menu`                        | sempre (`sm`/`md`/`lg`)      |
| `data-evo-selected` | `evoMenuItem`                     | `selected`                   |
| `data-evo-checked`  | `evoMenuCheckbox`, `evoMenuRadio` | marcado                      |
| `data-evo-in-bar`   | `evoMenuItem`                     | dentro de uma `evo-menu-bar` |

---

## Exemplos

### Mínimo

```html
<button evoButton variant="outline" [evoMenuTriggerFor]="conta">Conta</button>
<ng-template #conta>
  <evo-menu>
    <button evoMenuItem (activated)="perfil()">Perfil</button>
    <button evoMenuItem disabled>Facturação</button>
    <hr evoMenuSeparator />
    <button evoMenuItem (activated)="sair()">Terminar sessão</button>
  </evo-menu>
</ng-template>
```

### Botão de ícone, alinhado à direita

```html
<button
  evoButton
  variant="ghost"
  aria-label="Mais opções"
  [evoMenuTriggerFor]="opcoes"
  evoMenuPlacement="bottom-end"
>
  ⋮
</button>
```

Um botão só com ícone precisa de `aria-label`: é o nome do menu.

### Ícone, atalho, ligação e item actual

```html
<evo-menu size="lg">
  <button evoMenuItem selected>Início</button>
  <a evoMenuItem routerLink="/facturas">Facturas</a>
  <button evoMenuItem (activated)="guardar()">
    <svg slot="prefix" aria-hidden="true">…</svg>
    Guardar
    <kbd slot="suffix">⌘ S</kbd>
  </button>
</evo-menu>
```

### Caixas de verificação e escolha única

```html
<evo-menu>
  <button evoMenuCheckbox [(checked)]="grelha" [closeOnSelect]="false">Grelha</button>
  <hr evoMenuSeparator />
  <evo-menu-group label="Tamanho" [(value)]="tamanho">
    <button evoMenuRadio value="sm">Pequeno</button>
    <button evoMenuRadio value="md">Médio</button>
    <button evoMenuRadio value="lg">Grande</button>
  </evo-menu-group>
</evo-menu>
```

### Submenus

```html
<button evoMenuItem [evoMenuTriggerFor]="partilhar">Partilhar</button>
<ng-template #partilhar>
  <evo-menu>
    <button evoMenuItem>Email</button>
    <button evoMenuItem [evoMenuTriggerFor]="redes">Rede social</button>
  </evo-menu>
</ng-template>
```

O submenu herda o tamanho do pai. → abre-o, ← fecha-o, o Escape fecha só o de cima.

### Controlado

```html
<button evoButton [evoMenuTriggerFor]="m" [(evoMenuOpen)]="aberto">Menu</button>
<button evoButton variant="ghost" (click)="aberto.set(true)">Abrir por código</button>
```

### Barra de menus

```html
<evo-menu-bar aria-label="Menu da aplicação">
  <button evoMenuItem [evoMenuTriggerFor]="ficheiro">Ficheiro</button>
  <button evoMenuItem [evoMenuTriggerFor]="editar">Editar</button>
</evo-menu-bar>
```

Com a barra no foco, ←/→ passam de uma entrada à outra e ↓ abre o menu; com um
menu aberto, ←/→ e o rato por cima de outra entrada trocam de menu.

### Menu de contexto

```html
<div [evoContextMenuTriggerFor]="acoes">Clica com o botão direito</div>
```

### Por dados

```ts
protected readonly entradas = computed<EvoMenuEntry[]>(() => [
  { label: 'Novo ficheiro', suffix: '⌘ N', run: () => this.novo() },
  { label: 'Recentes', children: this.recentes().map((f) => ({ label: f.nome, run: () => this.abrir(f) })) },
  { type: 'separator' },
  { type: 'checkbox', label: 'Mostrar grelha', checked: this.grelha(), run: (v) => this.grelha.set(v) },
  {
    type: 'group', label: 'Tamanho', value: this.tamanho(), run: (v) => this.tamanho.set(v),
    children: [
      { type: 'radio', label: 'Pequeno', value: 'sm' },
      { type: 'radio', label: 'Grande', value: 'lg' },
    ],
  },
  { label: 'Documentação', href: '/docs' },
]);
```

```html
<button evoButton [evoMenuTriggerFor]="entradas()">Ficheiro</button>
```

### Menu embutido (sem gatilho)

```html
<evo-menu aria-label="Navegação">
  <button evoMenuItem selected>Início</button>
  <button evoMenuItem>Facturas</button>
</evo-menu>
```

---

## Personalizar

O painel é desenhado no fim do `<body>`, fora da árvore do gatilho. Por isso, ao
abrir, o `evo-menu` **copia os `[evoTokens]`** do gatilho e dos seus ancestrais:
um `[evoTokens]` numa secção, ou no próprio botão, chega ao painel e aos
submenus.

| Token                      | Controla                                                   | Herda de                       |
| -------------------------- | ---------------------------------------------------------- | ------------------------------ |
| `menu-bg`                  | Fundo do painel                                            | `--evo-color-surface-raised`   |
| `menu-border-color`        | Borda do painel (e da barra)                               | `--evo-color-border`           |
| `menu-radius`              | Raio do painel (e da barra)                                | `--evo-radius-md`              |
| `menu-shadow`              | Sombra do painel                                           | `--evo-elevation-2`            |
| `menu-min-width`           | Largura mínima do painel                                   | `9rem`                         |
| `menu-padding`             | Respiro entre a borda do painel e os itens                 | `--evo-space-xs`               |
| `menu-item-fg`             | Cor do texto dos itens                                     | `--evo-color-on-surface`       |
| `menu-item-hover-bg`       | Fundo do item em foco, com o rato, ou com o submenu aberto | `--evo-color-surface-sunken`   |
| `menu-item-selected-bg`    | Fundo do item `selected`                                   | `--evo-color-primary-soft`     |
| `menu-item-selected-fg`    | Texto do item `selected`                                   | `--evo-color-primary`          |
| `menu-item-padding-block`  | Respiro vertical dos itens (`sm`/`lg` definem o seu)       | `--evo-space-sm`               |
| `menu-item-padding-inline` | Respiro lateral dos itens (`sm`/`lg` definem o seu)        | `--evo-space-md`               |
| `menu-separator-color`     | Linha do separador                                         | `--evo-color-border`           |
| `menu-group-label-fg`      | Texto do cabeçalho de grupo                                | `--evo-color-on-surface-muted` |
| `menu-bar-bg`              | Fundo da barra de menus                                    | `--evo-color-surface`          |
| `menu-bar-item-active-bg`  | Entrada da barra cujo menu está aberto                     | `--evo-color-surface-sunken`   |
| `menu-duration`            | Duração da animação de entrada (0 = sem animação)          | `--evo-duration-fast`          |

O foco visível usa `--evo-focus-ring-*`; o texto e os espaços usam os tokens
semânticos. Para um item "perigoso" ou um estado que não existe aqui, usa um
`[evoTokens]` no item: o menu não tem variante `danger`.

```css
/* Global (styles.css): painéis mais redondos em toda a aplicação */
:root {
  --evo-menu-radius: 12px;
  --evo-menu-item-hover-bg: #e0e7ff;
}
```

```html
<!-- Por instância: o painel deste gatilho -->
<button
  evoButton
  [evoMenuTriggerFor]="m"
  [evoTokens]="{ 'menu-bg': '#fff7ed', 'menu-radius': '2px' }"
>
  Só este
</button>

<!-- Por subárvore: todos os menus abertos de dentro -->
<section [evoTokens]="{ 'menu-item-selected-bg': '#bbf7d0' }">…</section>
```

No Theme Studio aparece em "Superfícies", com os tokens agrupados (caixa, itens,
grupos, barra, movimento) e uma pré-visualização com os estados embutidos.

---

## Acessibilidade

O menu segue o padrão [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
e [Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) do WAI-ARIA.

| Tecla            | Onde             | Faz                                                                |
| ---------------- | ---------------- | ------------------------------------------------------------------ |
| Enter, Espaço, ↓ | gatilho          | Abre e foca o 1.º item                                             |
| ↑                | gatilho          | Abre e foca o último                                               |
| ↓ / ↑            | menu             | Próximo/anterior, com rotação                                      |
| Home / End       | menu             | Primeiro/último                                                    |
| uma letra        | menu             | Salta para o item que começa por ela (`typeaheadLabel` ou o texto) |
| →                | item com submenu | Abre-o; noutro item, numa barra, passa ao menu seguinte            |
| ←                | submenu          | Fecha-o e volta ao item pai                                        |
| Enter, Espaço    | item             | Activa-o (e fecha, salvo `closeOnSelect="false"`)                  |
| Escape           | menu             | Fecha o menu de cima e devolve o foco ao gatilho                   |
| Tab              | menu             | Fecha o menu e o foco segue do gatilho para o elemento seguinte    |
| ←/→, ↓           | barra de menus   | Passa de entrada; ↓ abre o menu da entrada                         |

- O gatilho tem `aria-haspopup="menu"` e `aria-expanded`; o painel tem
  `role="menu"` e é **nomeado pelo gatilho** (`aria-labelledby`). Num menu de
  contexto o painel fica sem nome: o alvo é uma área qualquer.
- Os itens são `menuitem`, `menuitemcheckbox` ou `menuitemradio`, com
  `aria-checked`. O grupo é `role="group"`, nomeado pelo cabeçalho. O item
  `selected` leva `aria-current="true"`.
- Um item `disabled` continua focável, com `aria-disabled="true"`.
- O Escape que fecha o menu **não** chega ao `evo-modal`/`evo-drawer` onde o menu
  esteja: o primeiro Escape fecha o menu, o segundo fecha o modal.
- O painel acompanha o gatilho ao fazer scroll (não bloqueia a página) e vira
  para cima quando não cabe por baixo.
- Com ponteiro táctil (`pointer: coarse`) os itens têm no mínimo 44 px de altura.
- `prefers-reduced-motion` desliga a animação de entrada.

Limitações herdadas do `CdkMenu`:

- Num `button` nativo, Enter, Espaço e clique são o mesmo evento: uma caixa de
  verificação fecha o menu com qualquer um, salvo `closeOnSelect="false"`.
- Ao abrir, o foco vai para o primeiro item, e não para o item `selected`.
- Numa barra de menus, trocar de menu com ←/→ deixa o foco na entrada da barra
  (↓ entra no menu); o padrão ARIA pede o foco no 1.º item.
- Um submenu abre com o rato quando já há um menu aberto; o `CdkMenu` usa um
  pequeno algoritmo de "pontaria" para não o fechar em diagonal.

---

## Referência: Joy UI `Menu`

Este componente não vem de um modelo em `src/app/component-models/`: foi feito
por engenharia reversa do `Menu` do Joy UI, medido no Chrome (Playwriter) antes
de escrever código. O que se manteve, mudou e acrescentou:

| Joy UI (`@mui/joy`)                         | Aqui                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `<Dropdown><MenuButton/><Menu/></Dropdown>` | `[evoMenuTriggerFor]` no botão + `<ng-template>` com `<evo-menu>`           |
| `MenuItem`                                  | `button[evoMenuItem]` / `a[evoMenuItem]`                                    |
| `MenuItem selected` (só visual)             | `selected` com `aria-current` e `data-evo-selected`                         |
| `MenuItem color="danger"`                   | sem variante: `[evoTokens]` no item                                         |
| `Menu variant` / `color` / `sx`             | tokens `--evo-menu-*` (sem variantes globais)                               |
| `Menu size` `sm`/`md`/`lg`                  | `size` no `evo-menu`; o submenu herda                                       |
| `Menu placement` (Popper)                   | `evoMenuPlacement` + `evoMenuOffset`; vira sozinho junto à borda            |
| `Dropdown open` / `onOpenChange`            | `[(evoMenuOpen)]`, `evoMenuOpened`, `evoMenuClosed`                         |
| `Menu keepMounted` / `disablePortal`        | não: o painel só existe aberto, e vive no overlay do CDK                    |
| `MenuList` + `Popper` à mão                 | `<evo-menu>` sem gatilho (menu embutido)                                    |
| `ListDivider` / grupo de `ToggleButton`s    | `hr[evoMenuSeparator]`, `evo-menu-group`, `evoMenuRadio`, `evoMenuCheckbox` |
| Menu bar (demo com vários `Dropdown`)       | `<evo-menu-bar>`; com a barra fechada ←/→ também passam de entrada          |
| — (não há submenus)                         | submenus a qualquer profundidade                                            |
| — (não há menu de contexto)                 | `[evoContextMenuTriggerFor]`                                                |

Defeitos do Joy que **não** se herdaram: painel sem nome acessível; Tab a deixar
o foco no `<body>`.
Comportamentos medidos e iguais: o clique e ↓ abrem no 1.º item e ↑ no último;
as setas rodam e Home/End saltam, ignorando separadores; o foco segue o rato;
clicar num item, o Escape e o clique no gatilho devolvem o foco ao gatilho; um
clique fora fecha sem devolver o foco; o painel vira para cima junto à borda.

---

## Ficheiros

```
components/src/lib/menu/
├── evo-menu.ts           painel (hostDirective CdkMenu)
├── evo-menu-item.ts      item, caixa, escolha única, grupo, separador
├── evo-menu-trigger.ts   gatilho de clique e de contexto; desenho por dados
├── evo-menu-bar.ts       barra de menus
├── menu.types.ts         EvoMenuPlacement, EvoMenuEntry…, posições
├── menu.css              estilos de todas as peças (só var(--evo-*))
├── menu.tokens.ts        metadados para o Theme Studio (17 tokens)
├── menu.preview.ts       pré-visualização no Studio (não exportado)
├── evo-menu.spec.ts      testes
├── README.md             esta documentação
└── index.ts
```
