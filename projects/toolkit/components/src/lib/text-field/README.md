# EvoTextField — `<evo-text-field>`

Campo de texto completo numa só tag: etiqueta, controlo (`<input>` ou
`<textarea>`), ícones, texto de ajuda, mensagem de erro e contador. Funciona
com `formControlName`, `[formControl]`, `[(ngModel)]` ou sozinho com
`[(value)]`, e mostra o erro do controlo **sem configuração**.

É composto pelo `EvoField` (disposição e etiqueta) e pelo aspecto do
`EvoInput` (a caixa usa a classe `evo-input`). Por isso afinar
`--evo-input-*` ou `--evo-field-*` afina também este componente.

```
 Email *                                ← label · * = obrigatório (required-fg)
╭───────────────────────────────────╮
│ 🔍  nome@evolium.ao        ×   👁 │  ← [slot=prefix] · controlo · limpar · senha · [slot=suffix]
╰───────────────────────────────────╯     caixa = --evo-input-*; ícones = icon-fg / icon-size / icon-gap
 Usamos só para recuperar a conta  12/80  ← hint (ou erro) · contador
```

| Estado      | Caixa                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| normal      | borda `--evo-input-border-color`                                          |
| foco        | borda `focus-border-color` + anel `focus-ring-color`                      |
| erro        | borda `--evo-color-danger` + anel `error-ring-color`, mensagem a vermelho |
| desactivado | fundo `disabled-bg`, 50% de opacidade                                     |

---

## Importar

```ts
import { EvoTextField } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoTextField, ReactiveFormsModule],
  // …
})
```

---

## API

| Nome            | Tipo                                                                                                | Omissão  | Angular   | Descrição                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------ |
| `value`         | `string`                                                                                            | `''`     | `model()` | Valor. `[(value)]` para usar sem formulários.                                                    |
| `label`         | `string`                                                                                            | `''`     | `input()` | Etiqueta. Sem ela, não é desenhada (usar então `hideLabel` com texto, para a acessibilidade).    |
| `hideLabel`     | `boolean`                                                                                           | `false`  | `input()` | Esconde a etiqueta visualmente; continua a ser lida pelos leitores de ecrã.                      |
| `hint`          | `string`                                                                                            | `''`     | `input()` | Texto de ajuda por baixo. Dá lugar à mensagem de erro, quando há uma.                            |
| `error`         | `string \| null \| (control) => string \| null`                                                     | `null`   | `input()` | Erro manual, com prioridade sobre o automático. A função recebe o `AbstractControl` (ou `null`). |
| `errorMessages` | `Record<string, string \| (detalhe) => string>`                                                     | `null`   | `input()` | Mensagens por chave de erro, só para este campo.                                                 |
| `type`          | `'text' \| 'email' \| 'password' \| 'search' \| 'tel' \| 'url' \| 'number' \| 'textarea' \| string` | `'text'` | `input()` | `textarea` troca o elemento; `password` acrescenta o botão mostrar/ocultar.                      |
| `placeholder`   | `string`                                                                                            | `''`     | `input()` |                                                                                                  |
| `size`          | `'sm' \| 'md' \| 'lg'`                                                                              | `'md'`   | `input()` | Os mesmos tamanhos do `evoInput`.                                                                |
| `required`      | `boolean \| undefined`                                                                              | —        | `input()` | Por omissão lido do controlo (`Validators.required`). `true`/`false` força.                      |
| `optional`      | `boolean`                                                                                           | `false`  | `input()` | Mostra "(opcional)". Ignorado se o campo for obrigatório.                                        |
| `disabled`      | `boolean`                                                                                           | `false`  | `input()` | Também desactivado por `control.disable()`.                                                      |
| `readonly`      | `boolean`                                                                                           | `false`  | `input()` |                                                                                                  |
| `autocomplete`  | `string`                                                                                            | `''`     | `input()` | Passado ao controlo nativo. Usar sempre em login/registo (`email`, `current-password`, …).       |
| `inputmode`     | `string`                                                                                            | `''`     | `input()` | Teclado em mobile (`numeric`, `tel`, `email`, …).                                                |
| `maxlength`     | `number`                                                                                            | —        | `input()` | Limite nativo. Com `formControlName`, o Angular junta também o validador `maxlength`.            |
| `rows`          | `number`                                                                                            | `4`      | `input()` | Linhas do `textarea`; com `autoResize`, a altura mínima.                                         |
| `autoResize`    | `boolean`                                                                                           | `false`  | `input()` | `textarea` cresce com o conteúdo (`field-sizing: content`; noutros browsers fica fixo).          |
| `showCount`     | `boolean`                                                                                           | `false`  | `input()` | Contador de caracteres (`12 / 80` com `maxlength`).                                              |
| `clearable`     | `boolean`                                                                                           | `false`  | `input()` | Botão × para apagar o valor; só aparece com valor e se o campo for editável.                     |

**Slots:** `[slot=prefix]` e `[slot=suffix]`, para ícones ou texto (ex.: `Kz`).
Um `<svg>` ou `<img>` num destes slots fica com o tamanho `--evo-text-field-icon-size`.

Atributos que o host reflecte, para CSS do projecto ou testes:

| Atributo              | Quando                                         |
| --------------------- | ---------------------------------------------- |
| `data-evo-size`       | sempre, com o tamanho                          |
| `data-evo-invalid`    | há mensagem de erro (manual ou automática)     |
| `data-evo-disabled`   | desactivado, pelo input **ou** pelo formulário |
| `data-evo-readonly`   | só de leitura                                  |
| `data-evo-hide-label` | `hideLabel`                                    |

---

## Exemplos

### Reactive Forms — erro automático

```ts
@Component({
  imports: [EvoTextField, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <evo-text-field formControlName="nome" label="Nome completo" autocomplete="name" />
      <evo-text-field formControlName="email" label="Email" type="email" autocomplete="email" />
      <evo-text-field
        formControlName="senha"
        label="Senha"
        type="password"
        autocomplete="new-password"
        hint="Pelo menos 8 caracteres."
      />
      <button evoButton>Guardar</button>
    </form>
  `,
})
export class Registo {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // mostra todos os erros de uma vez
      return;
    }
    // …
  }
}
```

O asterisco aparece sozinho nos campos com `Validators.required`. O erro
mostra-se **depois de o utilizador sair do campo** (`touched`), nunca a meio da
escrita, e desaparece logo que o valor fica válido.

### Mensagens próprias

```html
<!-- Só neste campo -->
<evo-text-field
  formControlName="nif"
  label="NIF"
  [errorMessages]="{ pattern: 'O NIF tem 9 dígitos, 2 letras e 3 dígitos, ou 10 dígitos.' }"
/>

<!-- Erro decidido por função (recebe o controlo) -->
<evo-text-field
  formControlName="confirmar"
  label="Confirmar senha"
  type="password"
  [error]="erroConfirmar"
/>
```

```ts
protected readonly erroConfirmar: EvoTextFieldErrorFn = (c) =>
  c?.touched && c.parent?.hasError('senhasDiferentes') ? 'As senhas não coincidem.' : null;
```

Um erro cujo valor já é texto mostra-se tal como vem, útil para erros da API:

```ts
this.form.controls.email.setErrors({ servidor: 'Este email já está registado.' });
```

### Mensagens para a aplicação inteira

```ts
// app.config.ts
import { provideEvoTextFieldMessages } from '@evolium-kit/toolkit/components';

providers: [
  provideEvoTextFieldMessages({
    errors: { nifInvalido: 'NIF inválido.', telefoneInvalido: 'Número de telefone inválido.' },
    optional: '(facultativo)',
  }),
];
```

As chaves de `errors` juntam-se às omissões (`required`, `email`, `minlength`,
`maxlength`, `min`, `max`, `pattern`); as restantes chaves substituem-se. Uma
chave sem mensagem mostra `fallbackError` ("Valor inválido.").

### Ícones e acções

```html
<evo-text-field formControlName="pesquisa" label="Pesquisar" hideLabel type="search" clearable>
  <svg slot="prefix" viewBox="0 0 24 24" aria-hidden="true">…</svg>
</evo-text-field>

<evo-text-field formControlName="valor" label="Valor" type="number" inputmode="decimal">
  <span slot="suffix">Kz</span>
</evo-text-field>
```

Ícones decorativos levam `aria-hidden="true"`. Com `type="number"`, o
formulário recebe um `number` (ou `null` se vazio), como no accessor nativo.

### Textarea

```html
<evo-text-field
  formControlName="obs"
  label="Observações"
  type="textarea"
  [rows]="3"
  autoResize
  showCount
  [maxlength]="500"
  optional
/>
```

### Sem formulários

```html
<evo-text-field [(value)]="filtro" label="Filtrar" hideLabel placeholder="Filtrar…" clearable />
```

### ngModel

```html
<evo-text-field [(ngModel)]="nome" name="nome" label="Nome" required />
```

---

## Personalizar

A caixa **não tem tokens próprios**: herda os do `EvoInput`, para que todos os
campos da aplicação se afinem num só sítio.

| Token herdado                       | Controla                           |
| ----------------------------------- | ---------------------------------- |
| `--evo-input-bg` / `-fg`            | fundo e cor do texto               |
| `--evo-input-border-color`          | borda (e `-hover`)                 |
| `--evo-input-radius`                | raio                               |
| `--evo-input-height`                | altura mínima                      |
| `--evo-input-padding-inline`        | espaço interior lateral            |
| `--evo-input-font-size`             | tamanho da letra                   |
| `--evo-field-gap`                   | espaço entre etiqueta/caixa/rodapé |
| `--evo-field-label-*`               | etiqueta                           |
| `--evo-field-hint-fg` / `-error-fg` | cor da ajuda e do erro             |

Tokens próprios:

| Token                                 | Controla                                     | Herda de                       |
| ------------------------------------- | -------------------------------------------- | ------------------------------ |
| `--evo-text-field-focus-border-color` | borda com foco                               | `--evo-color-primary`          |
| `--evo-text-field-focus-ring-color`   | anel de foco (caixa e botões internos)       | `--evo-focus-ring-color`       |
| `--evo-text-field-error-ring-color`   | anel à volta do campo com erro               | `--evo-color-danger-soft`      |
| `--evo-text-field-ring-width`         | espessura dos dois anéis                     | `--evo-focus-ring-width`       |
| `--evo-text-field-ring-offset`        | afastamento dos anéis (negativo: por dentro) | `--evo-focus-ring-offset`      |
| `--evo-text-field-disabled-bg`        | fundo desactivado                            | `--evo-color-surface-sunken`   |
| `--evo-text-field-optional-fg`        | "(opcional)"                                 | `--evo-color-on-surface-muted` |
| `--evo-text-field-required-fg`        | asterisco                                    | `--evo-color-danger`           |
| `--evo-text-field-icon-fg`            | ícones e botões internos                     | `--evo-color-on-surface-muted` |
| `--evo-text-field-icon-size`          | tamanho dos ícones                           | — (`1.125rem`, 18px)           |
| `--evo-text-field-icon-gap`           | espaço entre ícones e texto                  | `--evo-space-sm`               |

### Na aplicação inteira (`styles.css`)

```css
:root {
  --evo-input-radius: 6px;
  --evo-text-field-ring-width: 3px;
  --evo-text-field-ring-offset: 0;
}
```

### Numa só instância ou numa subárvore

```html
<evo-text-field
  label="Código"
  [evoTokens]="{ 'input-radius': '0', 'text-field-icon-size': '14px' }"
/>

<section [evoTokens]="{ 'text-field-focus-border-color': '#0d9488' }">
  <!-- todos os campos aqui dentro ficam com foco verde -->
</section>
```

O nome curto inclui sempre `text-field-`: `'ring-width'` sozinho é recusado
pelo compilador, porque viraria `--evo-ring-width`, que nenhum CSS lê. O editor
completa os nomes válidos. Os anéis só aparecem com o campo em foco ou em erro.

### No Theme Studio

Aparece em **Formulário → Text Field**, com os 11 tokens próprios no painel e
os estados (normal, ícone, senha, erro, desactivado, textarea com contador) na
pré-visualização. A caixa afina-se no painel **Input**.

---

## Acessibilidade

- `<label for>` ligado ao controlo por um id gerado sem `crypto` (seguro em SSR).
- `aria-invalid` e `aria-required` por binding, que saem ao sair do estado.
- Ajuda, erro e contador ligados por `aria-describedby`. A mensagem é uma região
  `aria-live="polite"` sempre presente, para o erro ser anunciado ao aparecer.
- O erro só aparece depois de `touched` — o leitor de ecrã não interrompe a escrita.
- Botões internos (senha, limpar) com nome acessível, `aria-controls`, e
  `aria-pressed` no da senha; alvo de toque de 44×44px; foco visível.
- O anel de foco desenha-se na caixa (envolve os ícones); o `<input>` interno
  perde o outline, mas o substituto está sempre lá. Em `forced-colors` o
  `outline` mantém-se.
- `hideLabel` usa o padrão _visually hidden_, nunca `display: none`.
- **Contraste:** a borda por omissão (`border-strong`) cumpre 3:1. Quem mudar
  `--evo-input-border-color` tem de manter 3:1 contra o fundo (WCAG 1.4.11).

---

## Migração a partir de `form-input-field`

Este componente começou como `FormFieldInputComponentV2` (`<form-input-field>`),
estilizado com Tailwind.

| Antes                                                        | Agora                                                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `FormFieldInputComponentV2`                                  | `EvoTextField`                                                                               |
| `<form-input-field>`                                         | `<evo-text-field>`                                                                           |
| `[erro]="texto"`                                             | `error="texto"`                                                                              |
| `[erro]="(form: FormGroup) => …"`                            | `[error]="(control) => …"` — recebe o **controlo**; o form é `control.parent`                |
| `[erro]="validacao.getErro('campo')"`                        | dispensável: o erro do controlo aparece sozinho; mensagens por `provideEvoTextFieldMessages` |
| `<svg leftIcon>` + importar `LeftIconDirective`              | `<svg slot="prefix">`, sem importar nada                                                     |
| `<svg rightIcon>` + importar `RightIconDirective`            | `<svg slot="suffix">`                                                                        |
| `[bgTransparent]="true"`                                     | `[evoTokens]="{ 'input-bg': 'transparent' }"`                                                |
| `inline` (não fazia nada)                                    | removido                                                                                     |
| `setDisabledState` vazio                                     | implementado: `control.disable()` funciona                                                   |
| `touched` a cada tecla                                       | `touched` ao sair do campo                                                                   |
| erro que não se actualizava sem nova função                  | reage a cada mudança do controlo                                                             |
| `crypto.randomUUID()`                                        | id por contador (SSR-safe)                                                                   |
| animações `animete-titulo-*` (do wrapper)                    | removidas                                                                                    |
| Tailwind: borda `#E2E8F0`, foco `brand-orange`, erro `red-*` | tokens (ver "Personalizar")                                                                  |

Para manter o aspecto antigo em toda a aplicação:

```css
:root {
  --evo-text-field-focus-border-color: #e05319; /* brand-orange-500 */
  --evo-text-field-focus-ring-color: #fbd5c4; /* brand-orange-200, aprox. */
  --evo-text-field-error-ring-color: #fca5a5; /* red-300 */
  --evo-text-field-ring-width: 3px;
  --evo-text-field-ring-offset: 0;
  --evo-text-field-optional-fg: #9a9a9a;
  --evo-input-fg: #585959;
  --evo-input-font-size: 0.875rem; /* text-sm */
  --evo-field-label-font-size: 0.75rem; /* text-xs */
  /* A borda #E2E8F0 não cumpre 3:1 contra branco; não recomendada. */
}
```

---

## Ficheiros

```
text-field/
├── evo-text-field.ts          componente + ControlValueAccessor (via NgControl)
├── text-field.messages.ts     mensagens por omissão e provideEvoTextFieldMessages()
├── text-field.css             estilos (só var(--evo-*), sem declarar --evo-text-field-*)
├── text-field.tokens.ts       metadados para o Theme Studio
├── text-field.preview.ts      pré-visualização no Studio
├── evo-text-field.spec.ts     testes (estados, ARIA, formulários, mensagens, regra 1 do CSS)
├── index.ts
└── README.md
```

Os ícones projectados são estilizados em `styles/evolium-components.css`
(conteúdo projectado não recebe o encapsulamento do componente).
