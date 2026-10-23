# EvoDrawer — `<evo-drawer>` e `EvoDrawerService`

Painéis sobrepostos que entram de um dos lados do ecrã, em duas formas, com o
mesmo aspecto e os mesmos tokens:

- **`<evo-drawer>`**, declarativo, aberto por `[(open)]`: para conteúdo que
  vive no template de quem o usa;
- **`EvoDrawerService`**, por código: `open()` de um componente ou template
  com dados, eventos e resultado tipados, ou só título/mensagem/acções.

Ambos assentam no `Dialog` do `@angular/cdk`, de onde vêm o focus trap, o
Escape, o bloqueio do scroll, a devolução do foco a quem abriu e o
`aria-modal`. O drawer é desenhado no fim do `<body>`, por cima de tudo.

```
position="right"                 position="top"
┌───────────────────┬───┐        ┌─────────────────────────┐
│          (fundo)   │ T │       │ Título                × │
│                    │ í │       │ ─────────────────────── │
│                    │ t │       │ Corpo                   │
│                    │ u │       └─────────────────────────┘
│                    │ l │
│                    │ o │  ← slot="header" / heading+description
│                    │ , │
│                    │ × │
│                    │ ─ │  ← --evo-drawer-divider-color
│                    │ C │
│                    │ o │  ← conteúdo por omissão
│                    │ r │
│                    │ p │
│                    │ o │
│                    │ ─ │
│                    │[OK│  ← slot="footer" / actions
└────────────────────┴───┘
```

## Quando usar

Para um painel **sobreposto**, com fundo e focus trap — conteúdo secundário
que interrompe. Para um painel **embutido** numa coluna do layout (sem
fundo nem overlay), isso é um componente de `layouts`, não este.

## Importar

```ts
import { EvoDrawer, EvoDrawerService } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoDrawer],
  // …
})
export class Pagina {
  private readonly drawers = inject(EvoDrawerService);
}
```

O serviço não precisa de configuração. Só os fragmentos da URL (ver
"Fragmento da URL") pedem uma linha no `app.config.ts`:

```ts
providers: [provideEvoDrawers({ fragments: { … } })];
```

## API — `<evo-drawer>`

| Nome              | Tipo                                       | Omissão   | Forma      | Descrição                                                                             |
| ----------------- | ------------------------------------------ | --------- | ---------- | ------------------------------------------------------------------------------------- |
| `open`            | `boolean`                                  | `false`   | `model()`  | Aberto ou fechado. `[(open)]`.                                                        |
| `heading`         | `string`                                   | `''`      | `input()`  | Título visível; dá o nome acessível. Substituído por `slot="header"`.                 |
| `description`     | `string`                                   | `''`      | `input()`  | Linha secundária do cabeçalho. Liga o `aria-describedby`.                             |
| `ariaLabel`       | `string`                                   | `''`      | `input()`  | Nome acessível quando não há `heading`.                                               |
| `position`        | `'left' \| 'right' \| 'top' \| 'bottom'`   | `'right'` | `input()`  | Lado de onde entra.                                                                   |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'full' \| string` | `'md'`    | `input()`  | Largura (`left`/`right`) ou altura (`top`/`bottom`). `full` ocupa o eixo todo.        |
| `backdrop`        | `boolean`                                  | `true`    | `input()`  | Mostra o fundo escurecido.                                                            |
| `closeOnBackdrop` | `boolean`                                  | `true`    | `input()`  | Clicar no fundo fecha. Sem efeito sem `backdrop`.                                     |
| `closeOnEscape`   | `boolean`                                  | `true`    | `input()`  | `Esc` fecha.                                                                          |
| `showClose`       | `boolean`                                  | `true`    | `input()`  | Botão × no canto.                                                                     |
| `beforeClose`     | `(reason) => boolean \| Promise<boolean>`  | `null`    | `input()`  | Guarda para Escape, fundo e ×. `false` mantém aberto.                                 |
| `(closed)`        | `EvoDrawerCloseReason`                     | —         | `output()` | Depois de fechar: `escape`, `backdrop`, `close-button`, `programmatic`, `navigation`. |

**Slots:** `slot="header"` (substitui `heading`/`description`), o corpo (por
omissão) e `slot="footer"`. Uma zona vazia não ocupa espaço.

**Atributos no host:** `data-evo-open` enquanto aberto. Na caixa
(`evo-drawer-panel`): `data-evo-position`, `data-evo-size`. No painel do CDK
(`.evo-drawer-pane`): os mesmos dois.

## API — `EvoDrawerService`

| Método                                  | Devolve                  | Descrição                                                |
| --------------------------------------- | ------------------------ | -------------------------------------------------------- |
| `open(config)`                          | `EvoDrawerRef<R, E>`     | Drawer só com título/mensagem/acções.                    |
| `open(componente \| template, config?)` | `EvoDrawerRef<R, E>`     | Componente standalone ou `TemplateRef` dentro do drawer. |
| `close(idOuFragmento)`                  | `boolean`                | Fecha um drawer pelo `id` ou `fragment`.                 |
| `closeAll()`                            | `void`                   | Fecha todos.                                             |
| `openDrawers`                           | `Signal<EvoDrawerRef[]>` | Os drawers abertos, do mais antigo para o mais recente.  |

### Opções de `open()` (`EvoDrawerConfig<D, R, E>`)

| Opção                                                                                                       | Tipo                              | Omissão      | Descrição                                                              |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------ | ---------------------------------------------------------------------- |
| `title`                                                                                                     | `string`                          | —            | Título.                                                                |
| `description`                                                                                               | `string`                          | —            | Linha secundária do cabeçalho.                                         |
| `message`                                                                                                   | `string`                          | —            | Texto do corpo, quando não há componente/template.                     |
| `data`                                                                                                      | `D`                               | —            | Para o conteúdo: `inject(EVO_DRAWER_DATA)` ou `let-dados` no template. |
| `actions`                                                                                                   | `EvoDrawerAction<R>[]`            | `[]`         | Botões do rodapé.                                                      |
| `on`                                                                                                        | `{ [evento]: (payload) => void }` | —            | Listeners do que o conteúdo emitir com `ref.emit()`.                   |
| `id`                                                                                                        | `string`                          | gerado       | Para `close(id)`. Abrir um `id` já aberto devolve o existente.         |
| `fragment`                                                                                                  | `string`                          | —            | Liga o drawer ao `#fragmento` da URL.                                  |
| `tokens`                                                                                                    | `EvoTokenMap`                     | —            | Tokens só deste drawer, como um `[evoTokens]`.                         |
| `injector`                                                                                                  | `Injector`                        | o do serviço | Injector pai do conteúdo.                                              |
| `position`, `size`, `backdrop`, `closeOnBackdrop`, `closeOnEscape`, `showClose`, `beforeClose`, `ariaLabel` |                                   |              | Como no `<evo-drawer>`.                                                |

### `EvoDrawerAction<R>`

Igual ao `EvoModalAction<R>`: `label`, `variant`, `value`, `handler` (com
`loading` enquanto corre), `closes`, `disabled`, `autofocus`.

### `EvoDrawerRef<R, E>`

Igual ao `EvoModalRef<R, E>`: `closed`, `close(result?)`, `requestClose()`,
`emit(nome, payload)`, `on(nome, fn)`, `isOpen`, `closeReason`, `id`,
`fragment`. Dentro do conteúdo: `injectDrawerRef<R, E>()` e
`inject(EVO_DRAWER_DATA)`.

## Exemplos

### Declarativo

```html
<button evoButton (click)="aAbrir.set(true)">Comandos</button>

<evo-drawer [(open)]="aAbrir" heading="Comandos" size="lg">
  <p>Lista de comandos…</p>
  <div slot="footer">
    <button evoButton variant="ghost" (click)="aAbrir.set(false)">Fechar</button>
    <button evoButton>Enviar</button>
  </div>
</evo-drawer>
```

### Cabeçalho próprio

```html
<evo-drawer [(open)]="aAbrir" ariaLabel="Detalhes do veículo" position="left" size="24rem">
  <div slot="header">
    <img [src]="veiculo().foto" alt="" class="h-9 w-9 rounded-lg" />
    <h2>{{ veiculo().matricula }}</h2>
  </div>
  <app-o-que-quiser />
</evo-drawer>
```

### Painel de baixo (mobile), com `beforeClose`

```html
<evo-drawer [(open)]="aAbrir" position="bottom" heading="Filtrar" [beforeClose]="perguntarSeSai">
  <form [formGroup]="filtros">…</form>
</evo-drawer>
```

```ts
protected readonly perguntarSeSai: EvoDrawerBeforeCloseFn = () =>
  !this.filtros.dirty || confirm('Perder as alterações?');
```

### Componente com dados, eventos e resultado

```ts
// form-motorista.ts
export class FormMotorista {
  protected readonly dados = inject<{ mode: 'create' | 'edit' }>(EVO_DRAWER_DATA);
  private readonly ref = injectDrawerRef<Motorista, { rascunho: Partial<Motorista> }>();

  gravar(m: Motorista) {
    this.ref.close(m);
  }
}

// quem abre
const ref = this.drawers.open<{ mode: 'create' }, Motorista>(FormMotorista, {
  title: 'Novo motorista',
  data: { mode: 'create' },
  position: 'right',
  size: 'lg',
});
const novo = await ref.closed; // Motorista | undefined
```

### Acção assíncrona, com erro mostrado no drawer

```ts
this.drawers.open({
  title: 'Exportar relatório',
  message: 'Gera um ficheiro com os dados do mês actual.',
  actions: [
    { label: 'Cancelar', variant: 'ghost' },
    { label: 'Exportar', handler: () => this.relatorios.exportar() }, // loading até resolver
  ],
});
```

### Fragmento da URL

`open(…, { fragment: 'novo-motorista' })` acrescenta `#novo-motorista` à URL.
O botão Voltar fecha o drawer; fechar o drawer tira o fragmento (com
`history.back()` se foi o drawer a pô-lo, para o Voltar não o reabrir). Para
reabrir ao recarregar a página ou ao seguir um link com o fragmento:

```ts
// app.config.ts
provideEvoDrawers({
  fragments: {
    'novo-motorista': (d) => d.open(FormMotorista, { title: 'Novo motorista', data: { mode: 'create' } }),
  },
}),
```

Sem `Router` na aplicação, `fragment` é ignorado.

## Personalizar

| Token                            | Controla                                | Herda de                       |
| -------------------------------- | --------------------------------------- | ------------------------------ |
| `--evo-drawer-bg`                | fundo da caixa                          | `--evo-color-surface-raised`   |
| `--evo-drawer-fg`                | texto                                   | `--evo-color-on-surface`       |
| `--evo-drawer-shadow`            | sombra                                  | `--evo-elevation-2`            |
| `--evo-drawer-padding`           | espaçamento interno                     | `--evo-space-lg`               |
| `--evo-drawer-divider-color`     | linha entre cabeçalho/corpo/rodapé      | `--evo-color-border`           |
| `--evo-drawer-border-color`      | borda                                   | `transparent`                  |
| `--evo-drawer-width-sm/md/lg`    | largura com `position="left"`/`"right"` | `20rem` / `28rem` / `40rem`    |
| `--evo-drawer-height-sm/md/lg`   | altura com `position="top"`/`"bottom"`  | `16rem` / `24rem` / `36rem`    |
| `--evo-drawer-backdrop`          | cor do fundo da página                  | `--evo-color-on-surface` a 40% |
| `--evo-drawer-backdrop-blur`     | desfoque do fundo da página             | `0`                            |
| `--evo-drawer-duration`          | duração da entrada                      | `--evo-duration-fast`          |
| `--evo-drawer-title-size`        | tamanho do título                       | `--evo-font-size-lg`           |
| `--evo-drawer-description-color` | cor da descrição                        | `--evo-color-on-surface-muted` |
| `--evo-drawer-close-color`       | botão ×                                 | `--evo-color-on-surface-muted` |
| `--evo-drawer-close-color-hover` | botão × em hover                        | `--evo-color-on-surface`       |

Os botões das acções são `EvoButton`: personalizam-se com os `--evo-button-*`.

```css
/* styles.css — toda a aplicação */
:root {
  --evo-drawer-width-md: 32rem;
  --evo-drawer-backdrop-blur: 6px;
}
```

```html
<!-- Uma instância -->
<evo-drawer [(open)]="aberto" [evoTokens]="{ 'drawer-width-lg': '36rem' }">…</evo-drawer>

<!-- Uma subárvore: os [evoTokens] dos ancestrais também são copiados para o drawer -->
<section [evoTokens]="{ 'drawer-bg': '#fffbeb' }">
  <evo-drawer [(open)]="aberto">…</evo-drawer>
</section>
```

```ts
// Pelo serviço: o drawer não está dentro de quem o abre, por isso passa-se aqui.
this.drawers.open(Form, { tokens: { 'drawer-width-lg': '36rem' } });
```

**Porque é que os tokens são copiados:** o CDK desenha o drawer no fim do
`<body>`, fora da árvore onde o `<evo-drawer>` está declarado, e a herança de
CSS não chegaria lá. Ao abrir, o `<evo-drawer>` copia os `--evo-*` que o
`[evoTokens]` escreveu nele e nos ancestrais (o mais próximo ganha). Os
valores de `:root` aplicam-se sempre, sem cópia.

No Theme Studio, o drawer aparece em **Superfícies**.

## Acessibilidade

- `role="dialog"` com `aria-modal="true"` no contentor do CDK; o resto da
  página fica `aria-hidden` enquanto o drawer está aberto.
- Nome acessível pelo `heading` (`aria-labelledby`, id único por instância)
  ou por `ariaLabel`. A `description`/`message` liga o `aria-describedby`.
- Focus trap: o Tab não sai do drawer. Ao abrir, o foco vai para o primeiro
  elemento focável do conteúdo (o botão × é sempre o último recurso). Ao
  fechar, volta a quem abriu.
- `Esc` fecha (passando pelo `beforeClose`, desligável com `closeOnEscape`);
  com vários drawers abertos, só o de cima.
- O × tem 44×44 px, `aria-label` traduzível (`provideEvoDrawerMessages`) e
  anel de foco `--evo-focus-ring-*`.
- O erro de uma acção aparece com `role="alert"`.
- `prefers-reduced-motion` desliga a animação de entrada.

## Migração a partir de `app-drawer-overlay`

| Antes                                                   | Agora                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `app-drawer-overlay`                                    | `<evo-drawer>` (declarativo) + `EvoDrawerService` (por código, novo)                 |
| `aberto` (`model`)                                      | `open` (`model`)                                                                     |
| `posicao: esquerda/direita/topo/fundo`                  | `position: left/right/top/bottom`                                                    |
| `tamanho: pequeno/medio/grande/total`                   | `size: sm/md/lg/full`                                                                |
| `titulo`, `descricao`                                   | `heading`, `description`                                                             |
| `comBackdrop`                                           | `backdrop`                                                                           |
| `fecharAoClicarFora`                                    | `closeOnBackdrop`                                                                    |
| `fecharComEsc`                                          | `closeOnEscape`                                                                      |
| `comFechar`                                             | `showClose`                                                                          |
| `rotuloFechar` (input por instância)                    | mensagem `EVO_DRAWER_MESSAGES.close`, sobreponível com `provideEvoDrawerMessages()`  |
| `rotulo`                                                | `ariaLabel`                                                                          |
| `fechado` (`output<void>`)                              | `closed` (`output<EvoDrawerCloseReason>`), com o motivo                              |
| `[drawerCabecalho]` (directiva estrutural)              | `slot="header"` (atributo, como no resto da toolkit)                                 |
| `[drawerRodape]` (directiva estrutural)                 | `slot="footer"`                                                                      |
| focus trap, `Esc`, bloqueio de scroll à mão             | `Dialog` do `@angular/cdk` (também traz `aria-hidden` automático no resto da página) |
| sem `beforeClose`                                       | `beforeClose`, como no `EvoModal`                                                    |
| sem jeito de abrir por código                           | `EvoDrawerService.open()`                                                            |
| cores/medidas Tailwind fixas (`#F1E7E4`, `gray-400`, …) | tokens `--evo-drawer-*` com fallback semântico                                       |
| `outline-brand-orange-500` fixo no ×                    | `--evo-focus-ring-*` (semântico, tematizável)                                        |

Bugs do original que deixam de existir: o `aria-labelledby` podia apontar
para um título que não chegava a ser desenhado quando havia `[drawerCabecalho]`
e `titulo` ao mesmo tempo; a duração da transição de saída (`setTimeout`)
tinha de bater manualmente com a classe Tailwind `duration-300`, sem nenhum
aviso se alguém mudasse só uma das duas; sem `Dialog` do CDK, o resto da
página não ficava `aria-hidden` para leitores de ecrã, e dois overlays
abertos ao mesmo tempo não tinham ordem de pilha garantida.

Não existia exit-animation real no original (`setTimeout` a remover do DOM
depois da transição); o `EvoDrawer`, tal como o `EvoModal`, só anima a
entrada — o `Dialog` do CDK remove o conteúdo do DOM assim que fecha.

Para reproduzir o aspecto antigo:

```css
:root {
  --evo-drawer-bg: #ffffff;
  --evo-drawer-divider-color: #f1e7e4;
  --evo-drawer-fg: #1f1f1f;
}
```

## Ficheiros

```
drawer/
├── evo-drawer.ts              <evo-drawer> declarativo
├── evo-drawer-panel.ts        a caixa visível (cabeçalho, corpo, rodapé, ×)
├── evo-drawer-container.ts    conteúdo aberto pelo serviço (interno)
├── drawer.service.ts          EvoDrawerService + provideEvoDrawers()
├── drawer-ref.ts              EvoDrawerRef, EVO_DRAWER_DATA, injectDrawerRef()
├── drawer-overlay.ts          abertura no Dialog do CDK + beforeClose (interno)
├── drawer.types.ts            tipos públicos
├── drawer.messages.ts         textos + provideEvoDrawerMessages()
├── drawer.css                 estilos da caixa (só var(--evo-*))
├── drawer-container.css       estilos da mensagem e dos botões do serviço
├── drawer.tokens.ts           metadados para o Theme Studio
├── drawer.preview.ts          pré-visualização no Theme Studio
├── evo-drawer.spec.ts         testes do componente
├── drawer.service.spec.ts     testes do serviço (acções, foco, fragmento, SSR)
├── index.ts
└── README.md
```

O fundo, o posicionamento do painel no ecrã e a substituição do cabeçalho por
`slot="header"` estão em `styles/evolium-components.css` (secção "Drawer"):
são elementos do overlay do CDK ou dependem de conteúdo projectado, que um
`styleUrl` encapsulado não alcança.
