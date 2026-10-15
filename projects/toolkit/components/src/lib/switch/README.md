# EvoSwitch — `<evo-switch>`

Interruptor ligado/desligado, temável por tokens e editável no Theme Studio.
Funciona sozinho, com `[(checked)]`, ou dentro de um formulário, com
`formControlName`, `[formControl]` ou `[(ngModel)]`, porque implementa
`ControlValueAccessor`.

```
 desligado            ligado              desactivado
 ╭──────────╮        ╭──────────╮        ╭──────────╮
 │ ●        │        │        ● │        │ ●        │  (50% opacidade)
 ╰──────────╯        ╰──────────╯        ╰──────────╯
  switch-bg          switch-bg-checked
  ● = switch-thumb-bg (cor) · switch-thumb-size (tamanho)
  cantos = switch-radius
```

---

## Importar

```ts
import { EvoSwitch } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoSwitch],
  // …
})
```

O componente importa `@angular/forms` (por causa do `ControlValueAccessor`). O
pacote está nas `peerDependencies` da toolkit e uma aplicação criada com
`ng new` já o traz.

---

## API

| Nome             | Tipo      | Omissão | Angular   | Descrição                                                                        |
| ---------------- | --------- | ------- | --------- | -------------------------------------------------------------------------------- |
| `checked`        | `boolean` | `false` | `model()` | Estado. Suporta `[(checked)]`; o evento `(checkedChange)` emite o novo valor.    |
| `disabled`       | `boolean` | `false` | `input()` | Desactiva o interruptor. Aceita o atributo sem valor: `<evo-switch disabled />`. |
| `ariaLabel`      | `string`  | `''`    | `input()` | Nome acessível, quando não há rótulo visível.                                    |
| `ariaLabelledby` | `string`  | `''`    | `input()` | `id` de um rótulo já visível no ecrã. Preferir este ao `ariaLabel`.              |

Atributos que o host reflecte, para CSS do projecto ou testes:

| Atributo            | Quando                                                    |
| ------------------- | --------------------------------------------------------- |
| `data-evo-checked`  | ligado                                                    |
| `data-evo-disabled` | desactivado, pelo input `disabled` **ou** pelo formulário |

---

## Exemplos

### Sozinho, com two-way binding

```html
<evo-switch [(checked)]="notificacoes" ariaLabel="Receber notificações" />
```

```ts
protected readonly notificacoes = signal(true);
```

### Com rótulo visível (recomendado)

```html
<span id="rotulo-2fa">Autenticação em dois passos</span>
<evo-switch [(checked)]="doisPassos" ariaLabelledby="rotulo-2fa" />
```

### Reagir à mudança

```html
<evo-switch [checked]="activo()" (checkedChange)="aoMudar($event)" ariaLabel="Activo" />
```

### Reactive Forms

```ts
@Component({
  imports: [EvoSwitch, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <span id="rotulo-web">Acesso pela web</span>
      <evo-switch formControlName="webLogin" ariaLabelledby="rotulo-web" />
    </form>
  `,
})
export class Exemplo {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({ webLogin: true });
}
```

`form.controls.webLogin.disable()` desactiva o interruptor de facto. O
`setDisabledState` está implementado, por isso o estado do controlo e o do
componente não divergem. O controlo fica `touched` quando o interruptor perde o
foco.

### ngModel

```html
<evo-switch [(ngModel)]="activo" ariaLabel="Activo" />
```

---

## Personalizar

| Token                     | Controla                       | Herda de                    |
| ------------------------- | ------------------------------ | --------------------------- |
| `--evo-switch-bg`         | fundo quando **desligado**     | `--evo-color-border-strong` |
| `--evo-switch-bg-checked` | fundo quando **ligado**        | `--evo-color-primary`       |
| `--evo-switch-thumb-bg`   | cor do círculo                 | `--evo-color-on-primary`    |
| `--evo-switch-radius`     | raio do fundo **e** do círculo | `--evo-radius-full`         |
| `--evo-switch-thumb-size` | tamanho (diâmetro) do círculo  | — (`1.25rem`, 20px)         |

**Raio.** Aplica-se ao fundo, e o círculo acompanha-o, descontando a folga de
2px à volta. `0` dá um interruptor quadrado. Metade da altura ou mais dá um
interruptor totalmente redondo (com o tamanho por omissão, 12px).

**Tamanho do círculo.** Todo o interruptor cresce a partir do diâmetro `d` do
círculo, para manter a proporção:

| `--evo-switch-thumb-size` | Fundo (largura × altura) |
| ------------------------- | ------------------------ |
| `16px`                    | 36 × 20                  |
| `20px` (omissão)          | 44 × 24                  |
| `28px`                    | 60 × 32                  |
| `40px`                    | 84 × 44                  |

A fórmula é: altura = `d + 4px`, largura = `2d + 4px`. A área de toque nunca
fica abaixo de 44×44px, por mais pequeno que seja o círculo.

Não existe token semântico de que este herde. O valor por omissão vive no
fallback do `var()`, como a altura do `EvoButton`. Por isso o Studio mostra o
controlo vazio até lhe dar um valor.

### Na aplicação inteira (`styles.css`)

```css
:root {
  --evo-switch-bg-checked: #e05319;
  --evo-switch-radius: 6px;
  --evo-switch-thumb-size: 24px; /* interruptor maior: 52 × 28 */
}
```

### Numa só instância ou numa subárvore

```html
<evo-switch
  [evoTokens]="{ 'switch-bg-checked': '#15803d', 'switch-thumb-bg': '#f0fdf4' }"
  ariaLabel="Aprovado"
/>

<section [evoTokens]="{ 'switch-radius': '4px' }">
  <!-- todos os evo-switch aqui dentro ficam com cantos de 4px -->
</section>

<!-- um interruptor compacto, numa tabela densa -->
<evo-switch [evoTokens]="{ 'switch-thumb-size': '14px' }" ariaLabel="Activo" />
```

### No Theme Studio

O Switch aparece em **Formulário → Switch**, com os cinco tokens acima no
painel de propriedades e a pré-visualização dos estados desligado, ligado e
desactivado lado a lado. Os metadados vivem em `switch.tokens.ts` e são
registados por `provideEvoComponents()`.

Não há variantes (o selector Global/Variante fica só em Global). Para
interruptores com cores diferentes numa mesma aplicação, usar `[evoTokens]`.

---

## Acessibilidade

- `<button type="button" role="switch">` com `aria-checked` sempre por binding.
- **Teclado:** Tab para chegar, Espaço ou Enter para alternar, que é o
  comportamento nativo do `<button>`.
- **Foco visível** com `--evo-focus-ring-*`.
- **Alvo de toque** de pelo menos 44×44px, seja qual for o tamanho do círculo. Um
  pseudo-elemento alarga a área clicável só no que ficar abaixo de 44px.
- O círculo é `aria-hidden`: o estado é comunicado por `aria-checked`, não pela
  posição.
- `prefers-reduced-motion` desliga a animação. Em `forced-colors` (alto
  contraste do Windows) o fundo ganha limite e o círculo usa `CanvasText`.
- **RTL:** o círculo desloca-se com `inset-inline-start`, por isso inverte
  sozinho em `dir="rtl"`.
- **Contraste:** as cores por omissão cumprem 3:1 (WCAG 1.4.11) no tema claro e no
  escuro (ver os comentários de `--evo-color-border-strong` em `default-theme.ts`).
  Quem alterar `switch-bg` tem de manter 3:1 contra a superfície onde o
  interruptor está.

---

## Migração a partir de `app-switch-button`

Este componente começou como `SwitchButtonComponent` (`<app-switch-button>`),
estilizado com Tailwind. Mudanças:

| Antes                                     | Agora                                                 |
| ----------------------------------------- | ----------------------------------------------------- |
| `SwitchButtonComponent`                   | `EvoSwitch`                                           |
| `<app-switch-button>`                     | `<evo-switch>`                                        |
| `(onChange)="f($event)"`                  | `(checkedChange)="f($event)"`, emitido pelo `model()` |
| laranja `#E05319` / cinza `#D1D5DB` fixos | tokens; por omissão, primário / `border-strong`       |
| `setDisabledState` vazio                  | implementado: `control.disable()` funciona            |

Para manter o laranja antigo em toda a aplicação:

```css
:root {
  --evo-switch-bg-checked: #e05319;
  --evo-switch-bg: #d1d5db;
}
```

---

## Ficheiros

```
switch/
├── evo-switch.ts        componente + ControlValueAccessor
├── switch.css           estilos (só var(--evo-*), sem declarar --evo-switch-*)
├── switch.tokens.ts     metadados para o Theme Studio
├── evo-switch.spec.ts   testes (estados, ARIA, formulários, regra 1 do CSS)
├── index.ts
└── README.md
```
