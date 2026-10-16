# EvoModal — `<evo-modal>` e `EvoModalService`

Janelas modais em duas formas, com o mesmo aspecto e os mesmos tokens:

- **`<evo-modal>`**, declarativo, aberto por `[(open)]`: para formulários e
  conteúdo que vive no template de quem o usa;
- **`EvoModalService`**, por código: `alert()`, `confirm()`, `prompt()`, os
  atalhos `success()`/`error()`/`warning()`/`info()`, e `open()` de um
  componente ou template com dados, eventos e resultado tipados.

Ambos assentam no `Dialog` do `@angular/cdk`, de onde vêm o focus trap, o
Escape, o bloqueio do scroll, a devolução do foco a quem abriu e o
`aria-modal`. O modal é desenhado no fim do `<body>`, por cima de tudo.

```
┌──────────────────────────────────────┐
│                 (ícone)            × │  ← tone / slot="icon" · showClose
│  Título                              │  ← heading / slot="title"
│  Corpo (scroll se passar da altura)  │  ← conteúdo por omissão
│ ──────────────────────────────────── │  ← --evo-modal-divider-color
│                  [Cancelar] [Gravar] │  ← slot="footer" / actions
└──────────────────────────────────────┘
```

## Importar

```ts
import { EvoModal, EvoModalService } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoModal],
  // …
})
export class Pagina {
  private readonly modals = inject(EvoModalService);
}
```

O serviço não precisa de configuração. Só os fragmentos da URL (ver
"Fragmento da URL") pedem uma linha no `app.config.ts`:

```ts
providers: [provideEvoModals({ fragments: { … } })];
```

## API — `<evo-modal>`

| Nome              | Tipo                                                                           | Omissão    | Forma      | Descrição                                                                             |
| ----------------- | ------------------------------------------------------------------------------ | ---------- | ---------- | ------------------------------------------------------------------------------------- |
| `open`            | `boolean`                                                                      | `false`    | `model()`  | Aberto ou fechado. `[(open)]`.                                                        |
| `heading`         | `string`                                                                       | `''`       | `input()`  | Título visível; dá o nome acessível. Também `slot="title"`.                           |
| `ariaLabel`       | `string`                                                                       | `''`       | `input()`  | Nome acessível quando não há título visível.                                          |
| `size`            | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' \| string`                             | `'md'`     | `input()`  | Largura (`--evo-modal-width-*`). `full` ocupa o ecrã.                                 |
| `position`        | `'center' \| 'top'`                                                            | `'center'` | `input()`  | `top` encosta ao topo — bom para formulários longos.                                  |
| `tone`            | `'success' \| 'danger' \| 'warning' \| 'info' \| 'question' \| string \| null` | `null`     | `input()`  | Ícone e cor. Com ícone, o conteúdo fica centrado.                                     |
| `closeOnBackdrop` | `boolean`                                                                      | `true`     | `input()`  | Clicar no fundo fecha.                                                                |
| `showClose`       | `boolean`                                                                      | `true`     | `input()`  | Botão × no canto.                                                                     |
| `beforeClose`     | `(reason) => boolean \| Promise<boolean>`                                      | `null`     | `input()`  | Guarda para Escape, fundo e ×. `false` mantém aberto.                                 |
| `(closed)`        | `EvoModalCloseReason`                                                          | —          | `output()` | Depois de fechar: `escape`, `backdrop`, `close-button`, `programmatic`, `navigation`. |

**Slots:** `slot="icon"` (substitui o ícone do tom, mantendo a cor),
`slot="title"`, o corpo (por omissão) e `slot="footer"`. Uma zona vazia não
ocupa espaço.

**Atributos no host:** `data-evo-open` enquanto aberto. Na caixa
(`evo-modal-panel`): `data-evo-size`, `data-evo-tone`. No painel do CDK
(`.evo-modal-pane`): `data-evo-size`, `data-evo-position`.

## API — `EvoModalService`

| Método                                    | Devolve                   | Descrição                                                                            |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `open(config)`                            | `EvoModalRef<R, E>`       | Modal só com título/mensagem/acções.                                                 |
| `open(componente \| template, config?)`   | `EvoModalRef<R, E>`       | Componente standalone ou `TemplateRef` dentro do modal.                              |
| `alert(config)`                           | `Promise<void>`           | Mensagem com um botão.                                                               |
| `success/error/warning/info(msg, title?)` | `Promise<void>`           | Atalhos de `alert()` com o tom e um título por omissão.                              |
| `confirm(config \| mensagem)`             | `Promise<boolean>`        | `true` só se confirmar. Com `tone: 'danger'`, botão `danger` e foco em Cancelar.     |
| `prompt(config)`                          | `Promise<string \| null>` | Pede um texto (`evo-text-field`). Enter confirma; `required` impede confirmar vazio. |
| `close(idOuFragmento)`                    | `boolean`                 | Fecha um modal pelo `id` ou `fragment`.                                              |
| `closeAll()`                              | `void`                    | Fecha todos.                                                                         |
| `openModals`                              | `Signal<EvoModalRef[]>`   | Os modais abertos, do mais antigo para o mais recente.                               |

### Opções de `open()` (`EvoModalConfig<D, R, E>`)

| Opção                                                                                  | Tipo                              | Omissão                       | Descrição                                                               |
| -------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `title`                                                                                | `string`                          | —                             | Título.                                                                 |
| `message`                                                                              | `string`                          | —                             | Texto do corpo (as quebras de linha contam). Liga o `aria-describedby`. |
| `data`                                                                                 | `D`                               | —                             | Para o conteúdo: `inject(EVO_MODAL_DATA)` ou `let-dados` no template.   |
| `actions`                                                                              | `EvoModalAction<R>[]`             | `[OK]` sem conteúdo, `[]` com | Botões do rodapé. `[]` tira todos.                                      |
| `on`                                                                                   | `{ [evento]: (payload) => void }` | —                             | Listeners do que o conteúdo emitir com `ref.emit()`.                    |
| `icon`                                                                                 | `TemplateRef \| Type`             | —                             | Ícone próprio; o `tone` escolhe a cor.                                  |
| `id`                                                                                   | `string`                          | gerado                        | Para `close(id)`. Abrir um `id` já aberto devolve o existente.          |
| `fragment`                                                                             | `string`                          | —                             | Liga o modal ao `#fragmento` da URL.                                    |
| `tokens`                                                                               | `EvoTokenMap`                     | —                             | Tokens só deste modal, como um `[evoTokens]`.                           |
| `injector`                                                                             | `Injector`                        | o do serviço                  | Injector pai do conteúdo.                                               |
| `size`, `position`, `tone`, `closeOnBackdrop`, `showClose`, `beforeClose`, `ariaLabel` |                                   |                               | Como no `<evo-modal>`.                                                  |

### `EvoModalAction<R>`

| Campo       | Tipo                                       | Descrição                                                                                  |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `label`     | `string`                                   | Texto.                                                                                     |
| `variant`   | `EvoVariant`                               | Variante do `EvoButton` (`solid` por omissão).                                             |
| `value`     | `R`                                        | Resultado com que o modal fecha.                                                           |
| `handler`   | `(ref) => R \| void \| Promise<R \| void>` | Corre ao clicar, com `loading` no botão. Se rejeitar, o modal fica aberto e mostra o erro. |
| `closes`    | `boolean`                                  | `false` para não fechar.                                                                   |
| `disabled`  | `() => boolean`                            | Inactivo enquanto devolver `true` (pode ler signals).                                      |
| `autofocus` | `boolean`                                  | Recebe o foco ao abrir.                                                                    |

### `EvoModalRef<R, E>`

| Membro                | Descrição                                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| `closed`              | `Promise<R \| undefined>`; nunca rejeita. Escape, fundo e × dão `undefined`. |
| `close(result?)`      | Fecha já, sem `beforeClose`.                                                 |
| `requestClose()`      | Fecha como o ×, passando pelo `beforeClose`. Resolve `true` se fechou.       |
| `emit(nome, payload)` | Emite para os listeners de `on`.                                             |
| `on(nome, fn)`        | Ouve um evento; devolve a função que deixa de ouvir.                         |
| `isOpen`              | `Signal<boolean>`.                                                           |
| `closeReason`         | Porque fechou, ou `null`.                                                    |
| `id`, `fragment`      | Identificadores.                                                             |

Dentro do conteúdo: `injectModalRef<R, E>()` e `inject(EVO_MODAL_DATA)`.

## Exemplos

### Declarativo, com formulário

```html
<button evoButton (click)="aEditar.set(true)">Editar</button>

<evo-modal [(open)]="aEditar" heading="Editar empresa" size="lg" [beforeClose]="perguntarSeSai">
  <form id="f-empresa" [formGroup]="form" (ngSubmit)="gravar()">
    <evo-text-field formControlName="nome" label="Nome" />
  </form>
  <div slot="footer">
    <button evoButton variant="ghost" (click)="aEditar.set(false)">Cancelar</button>
    <button evoButton type="submit" form="f-empresa">Gravar</button>
  </div>
</evo-modal>
```

```ts
protected readonly aEditar = signal(false);

protected readonly perguntarSeSai: EvoModalBeforeCloseFn = () =>
  !this.form.dirty || this.modals.confirm({ message: 'Perder as alterações?', tone: 'danger' });
```

### Alertas e confirmação

```ts
await this.modals.success('Pagamento aceite.');
await this.modals.error('Não foi possível gravar.', 'Falhou');

if (
  await this.modals.confirm({
    message: 'Eliminar a factura FT 2026/14?',
    tone: 'danger',
    confirmLabel: 'Eliminar',
  })
) {
  await this.facturas.remover(id);
}

const motivo = await this.modals.prompt({ title: 'Anular', label: 'Motivo', required: true });
```

### Acção assíncrona, com erro mostrado no modal

```ts
this.modals.open({
  title: 'Submeter a declaração?',
  message: 'Depois de submetida não pode ser alterada.',
  actions: [
    { label: 'Cancelar', variant: 'ghost' },
    { label: 'Submeter', handler: () => this.declaracoes.submeter(id) }, // loading até resolver
  ],
});
```

### Componente com dados, eventos e resultado

```ts
// form-motorista.ts
export class FormMotorista {
  protected readonly dados = inject<{ mode: 'create' | 'edit'; motorista?: Motorista }>(
    EVO_MODAL_DATA,
  );
  private readonly ref = injectModalRef<Motorista, { rascunho: Partial<Motorista> }>();

  gravar(m: Motorista) {
    this.ref.close(m);
  }
  guardarRascunho(r: Partial<Motorista>) {
    this.ref.emit('rascunho', r);
  }
}

// quem abre
const ref = this.modals.open<{ mode: 'create' }, Motorista, { rascunho: Partial<Motorista> }>(
  FormMotorista,
  {
    title: 'Registar motorista',
    data: { mode: 'create' },
    position: 'top',
    on: { rascunho: (r) => this.rascunhos.guardar(r) },
  },
);
const novo = await ref.closed; // Motorista | undefined
```

### Template em vez de componente

```html
<ng-template #detalhe let-factura let-ref="ref">
  <p>{{ factura.numero }} — {{ factura.total }}</p>
  <button evoButton (click)="ref.close()">Fechar</button>
</ng-template>
```

```ts
this.modals.open(this.detalhe(), { title: 'Factura', data: factura });
```

### Ícone próprio

```html
<evo-modal [(open)]="ok" tone="success" heading="Conta verificada">
  <svg slot="icon" viewBox="0 0 24 24">…</svg>
  <p>Já pode emitir facturas.</p>
</evo-modal>
```

```ts
this.modals.alert({ tone: 'success', title: 'Conta verificada', icon: this.iconeVerificado() });
```

### Fragmento da URL

`open(…, { fragment: 'registar-motorista' })` acrescenta `#registar-motorista`
à URL. O botão Voltar fecha o modal; fechar o modal tira o fragmento (com
`history.back()` se foi o modal a pô-lo, para o Voltar não o reabrir). Para
reabrir ao recarregar a página ou ao seguir um link com o fragmento:

```ts
// app.config.ts
provideEvoModals({
  fragments: {
    'registar-motorista': (m) => m.open(FormMotorista, { title: 'Registar motorista', data: { mode: 'create' } }),
  },
}),
```

Sem `Router` na aplicação, `fragment` é ignorado.

## Personalizar

| Token                           | Controla                            | Herda de                              |
| ------------------------------- | ----------------------------------- | ------------------------------------- |
| `--evo-modal-bg`                | fundo da caixa                      | `--evo-color-surface-raised`          |
| `--evo-modal-fg`                | texto                               | `--evo-color-on-surface`              |
| `--evo-modal-radius`            | raio (aceita `24px 24px 0 0`)       | `--evo-radius-lg`                     |
| `--evo-modal-padding`           | espaçamento interno                 | `--evo-space-lg`                      |
| `--evo-modal-shadow`            | sombra                              | `--evo-elevation-2`                   |
| `--evo-modal-border-color`      | borda                               | `transparent`                         |
| `--evo-modal-divider-color`     | linha por cima do rodapé            | `--evo-color-border`                  |
| `--evo-modal-width-sm/md/lg/xl` | largura por `size`                  | `24rem` / `28rem` / `32rem` / `42rem` |
| `--evo-modal-max-height`        | altura máxima (o corpo faz scroll)  | `90dvh`                               |
| `--evo-modal-backdrop`          | cor do fundo da página              | `--evo-color-on-surface` a 40%        |
| `--evo-modal-backdrop-blur`     | desfoque do fundo da página         | `0`                                   |
| `--evo-modal-duration`          | duração da entrada                  | `--evo-duration-fast`                 |
| `--evo-modal-title-size`        | tamanho do título                   | `--evo-font-size-lg`                  |
| `--evo-modal-message-color`     | cor da `message` do serviço         | `--evo-color-on-surface-muted`        |
| `--evo-modal-icon-size`         | tamanho do ícone (também o próprio) | `4rem`                                |
| `--evo-modal-icon-success`      | ícone de `tone="success"`           | `--evo-color-success`                 |
| `--evo-modal-icon-danger`       | ícone de `tone="danger"`            | `--evo-color-danger`                  |
| `--evo-modal-icon-warning`      | ícone de `tone="warning"`           | `--evo-color-warning`                 |
| `--evo-modal-icon-info`         | ícone de `info` e `question`        | `--evo-color-primary`                 |
| `--evo-modal-close-color`       | botão ×                             | `--evo-color-on-surface-muted`        |
| `--evo-modal-close-color-hover` | botão × em hover                    | `--evo-color-on-surface`              |
| `--evo-modal-actions-align`     | alinhamento dos botões do rodapé    | `flex-end`; `center` quando há ícone  |

Os botões das acções são `EvoButton`: personalizam-se com os `--evo-button-*`.

```css
/* styles.css — toda a aplicação */
:root {
  --evo-modal-radius: 24px 24px 0 0;
  --evo-modal-backdrop-blur: 6px;
  --evo-modal-width-md: 32rem;
}
```

```html
<!-- Uma instância -->
<evo-modal [(open)]="aberto" [evoTokens]="{ 'modal-radius': '0px', 'modal-padding': '2rem' }"
  >…</evo-modal
>

<!-- Uma subárvore: os [evoTokens] dos ancestrais também são copiados para o modal -->
<section [evoTokens]="{ 'modal-bg': '#fffbeb', 'button-bg': '#b45309' }">
  <evo-modal [(open)]="aberto">…</evo-modal>
</section>
```

```ts
// Pelo serviço: o modal não está dentro de quem o abre, por isso passa-se aqui.
this.modals.open(Form, { tokens: { 'modal-radius': '0px' } });
```

**Porque é que os tokens são copiados:** o CDK desenha o modal no fim do
`<body>`, fora da árvore onde o `<evo-modal>` está declarado, e a herança de
CSS não chegaria lá. Ao abrir, o `<evo-modal>` copia os `--evo-*` que o
`[evoTokens]` escreveu nele e nos ancestrais (o mais próximo ganha). Os
valores de `:root` aplicam-se sempre, sem cópia. Uma alteração ao
`[evoTokens]` com o modal já aberto só se vê na abertura seguinte.

No Theme Studio, o modal aparece em **Superfícies**: a pré-visualização mostra
as caixas lado a lado (com e sem tom, com ícone próprio) e botões que abrem um
modal a sério, para ver o fundo, a animação e o foco.

## Acessibilidade

- `role="dialog"` com `aria-modal="true"` no contentor do CDK; o resto da
  página fica `aria-hidden` enquanto o modal está aberto.
- Nome acessível pelo título (`aria-labelledby`, com id único por instância)
  ou por `ariaLabel`. A `message` do serviço liga o `aria-describedby`.
- Focus trap: o Tab não sai do modal. Ao abrir, o foco vai para o primeiro
  elemento focável do conteúdo; nos alertas, para o botão principal; no
  `confirm` com `tone: 'danger'`, para Cancelar. Ao fechar, volta a quem abriu.
- Escape fecha (passando pelo `beforeClose`); com vários modais abertos, só o
  de cima.
- O × tem 44×44 px, `aria-label` traduzível (`provideEvoModalMessages`) e anel
  de foco `--evo-focus-ring-*`. O ícone do tom é `aria-hidden`.
- O erro de uma acção aparece com `role="alert"`.
- `prefers-reduced-motion` desliga a animação de entrada.

## Migração a partir de `AlertModalService` / `app-modal-generico`

| Antes                                                         | Agora                                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `AlertModalService`                                           | `EvoModalService`                                                                 |
| `modal(opts)` / `open(opts)`                                  | `open(opts)` ou `open(Componente, opts)`                                          |
| `{ template: Componente }`                                    | 1.º argumento de `open()` (também `TemplateRef`)                                  |
| `{ template: 'nome' }` + `registerComponentTemplates()`       | removido — nunca funcionou (registava numa instância descartada); passar o `Type` |
| `titulo`, `mensagem`                                          | `title`, `message`                                                                |
| `icon: 'success' \| 'error' \| …`                             | `tone: 'success' \| 'danger' \| 'warning' \| 'info' \| 'question'`                |
| `icon: 'verify'`                                              | `icon: TemplateRef \| Type` (ícone próprio) + `tone`                              |
| `temHeader: true` (para o título aparecer)                    | basta `title` — o título aparece sempre que existe                                |
| `semBotoes: true`                                             | `actions: []`                                                                     |
| `botoes: [{ label, variant, onClick, closeOnClick }]`         | `actions: [{ label, variant, handler, closes, value }]`                           |
| `variant: 'primary' \| 'secondary' \| 'danger'`               | `'solid' \| 'ghost' \| 'danger'` (do `EvoButton`)                                 |
| `AlertResult { confirmado, botaoIndex }`                      | `ref.closed` resolve com o `value` do botão; `confirm()` dá `boolean`             |
| `confirmado` = "clicou no último botão"                       | o `value` de cada acção decide                                                    |
| `fecharAoClicarFundo` (omissão `false`)                       | `closeOnBackdrop` (omissão `true`)                                                |
| `tamanho: pequeno/medio/grande/xgrande/xlgrande/full`         | `size: sm/md/lg/xl/full` (`xlgrande` → `xl` ou `--evo-modal-width-xl: 80vw`)      |
| `data` + `inject(ModalDataService).obterDados()`              | `data` + `inject(EVO_MODAL_DATA)`                                                 |
| `on: {…}` + `inject(ModalEventsService).emitir(n, d)`         | `on: {…}` + `injectModalRef().emit(n, d)` (tipado)                                |
| `on.fechar` (nome "mágico")                                   | `await ref.closed`                                                                |
| `fechar(id)` / `close(id)` / `fecharTodos()` / `closeAll()`   | `close(id)` / `closeAll()`                                                        |
| `obterUltimoModalId()`                                        | `openModals().at(-1)?.id`                                                         |
| `fragment`, `fragmented`, `closeOnFragmentRemoval`            | `fragment` (sempre sai da URL ao fechar)                                          |
| `openFragmented()` / `registerFragment()`                     | `open(…, { fragment })` / `provideEvoModals({ fragments })`                       |
| `kind: 'drawer'`, `temFooter`                                 | removidos — nunca fizeram nada                                                    |
| `sucesso/erro/aviso/info/confirmar`                           | `success/error/warning/info/confirm`                                              |
| `<app-modal-generico [isAberto] (aoFechar)>`                  | `<evo-modal [(open)]>` (ou `[open]` + `(closed)`)                                 |
| `titulo`, `tamanho`, `headerVisisvel`, `isModalPersonalizado` | `heading`, `size`, `showClose`, token `--evo-modal-padding`                       |
| `<app-modal-alerta>` / `<app-modal-confirmacao>`              | `modals.alert()` / `modals.confirm()`                                             |
| sem Escape, focus trap nem devolução do foco                  | vêm do `Dialog` do CDK                                                            |

Bugs do original que deixam de existir: os atalhos `sucesso()`/`erro()`
nunca mostravam o título; os templates por string nunca funcionavam; um
`onClick` que rejeitasse deixava a promessa por resolver e o modal preso; a
cor do ícone era aplicada como classe; havia dois fundos com desfoque
sobrepostos, um deles focável e `aria-hidden`; o `id` do título era fixo
(duplicado com dois modais); e o modal só reabria pelo fragmento se alguém
tivesse chamado `registerFragment` antes.

Para reproduzir o aspecto antigo:

```css
:root {
  --evo-modal-backdrop: rgb(0 0 0 / 0.2);
  --evo-modal-backdrop-blur: 16px;
  --evo-modal-radius: 0.5rem;
  --evo-modal-icon-size: 5rem;
  --evo-modal-icon-success: #098700;
  --evo-modal-icon-danger: #fd0909;
  --evo-modal-icon-warning: #e47202;
  --evo-modal-icon-info: #0085b5;
  --evo-modal-actions-align: center;
}
```

(Os botões redondos laranja do original: `--evo-button-radius: 9999px` e
`--evo-button-bg` dentro de um `[evoTokens]`, ou na variante do projecto.)

## Ficheiros

```
modal/
├── evo-modal.ts              <evo-modal> declarativo
├── evo-modal-panel.ts        a caixa visível (ícone, título, corpo, rodapé, ×)
├── evo-modal-container.ts    conteúdo aberto pelo serviço (interno) + campo do prompt()
├── modal.service.ts          EvoModalService + provideEvoModals()
├── modal-ref.ts              EvoModalRef, EVO_MODAL_DATA, injectModalRef()
├── modal-overlay.ts          abertura no Dialog do CDK + beforeClose (interno)
├── modal.types.ts            tipos públicos
├── modal.messages.ts         textos + provideEvoModalMessages()
├── modal.css                 estilos da caixa (só var(--evo-*))
├── modal-container.css       estilos da mensagem e dos botões do serviço
├── modal.tokens.ts           metadados para o Theme Studio
├── modal.preview.ts          pré-visualização no Theme Studio
├── evo-modal.spec.ts         testes do componente
├── modal.service.spec.ts     testes do serviço (acções, foco, fragmento, SSR)
├── index.ts
└── README.md
```

O fundo, a posição do painel e o ícone projectado estão em
`styles/evolium-components.css` (secção "Modal"): são elementos do overlay do
CDK ou conteúdo projectado, que um `styleUrl` encapsulado não alcança.
