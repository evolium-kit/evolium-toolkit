# EvoProgressBar — `<evo-progress-bar>`

Barra de progresso fina, fixa no topo da página — para indicar que uma troca
de rota (ou outra operação) está a acontecer. Inspirada no
[NProgress](https://ricostacruz.com/nprogress/), medido no código-fonte real.

```
┌──────────────────────────────────────────────┐
│███████████████▓░                              │  ← progress-bar-height
└──────────────────────────────────────────────┘
 ╰── progress-bar-color ──╯╰ progress-bar-glow-color (o "peg", na ponta)
```

---

## Importar

```ts
import { EvoProgressBar } from '@evolium-kit/toolkit/components';

@Component({
  imports: [EvoProgressBar],
  // …
})
```

O modo `router` usa `@angular/router` — já é uma dependência de qualquer
aplicação com rotas.

---

## API

| Nome            | Tipo                     | Omissão        | Angular   | Descrição                                                                                            |
| --------------- | ------------------------ | -------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `mode`          | `'manual' \| 'router'`   | `'manual'`     | `input()` | `manual`: o progresso vem de `value`. `router`: a barra ouve o `Router` sozinha; `value` é ignorado. |
| `value`         | `number \| null` (0–100) | `null`         | `input()` | Só em `mode="manual"`. `null` oculta a barra.                                                        |
| `indeterminate` | `boolean`                | `false`        | `input()` | Só em `mode="manual"`. Ignora `value` — mostra um segmento a deslizar, sem percentagem conhecida.    |
| `ariaLabel`     | `string`                 | `'A carregar'` | `input()` | Nome acessível do `role="progressbar"`.                                                              |

Sem `output()` — é um indicador, não um controlo.

Atributos que o host reflecte, para CSS do projecto ou testes:

| Atributo                 | Quando                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| `data-evo-modo`          | `"manual"` ou `"router"`                                           |
| `data-evo-estado`        | `"activo"`, `"a-concluir"` (só router, a desvanecer) ou `"oculto"` |
| `data-evo-indeterminado` | presente quando `indeterminate` está activo                        |

---

## Exemplos

### Em cada troca de rota (o caso de uso mais comum)

Uma instância no layout raiz da aplicação (ex. `app.component.html`), e nunca
mais se mexe nela:

```html
<evo-progress-bar mode="router" ariaLabel="A mudar de página" />
```

Entra ao arrancar uma navegação (`NavigationStart`), avança sozinha enquanto
está pendente, e salta a 100% + desvanece ao terminar — com sucesso
(`NavigationEnd`), cancelada (`NavigationCancel`, ex. um guarda que recusa),
com erro (`NavigationError`) ou ignorada (`NavigationSkipped`). Uma navegação
nova reinicia a barra do zero, mesmo que a anterior ainda esteja a meio.

### Manual, com percentagem conhecida

```html
<evo-progress-bar [value]="progressoUpload()" ariaLabel="A enviar ficheiro" />
```

```ts
protected readonly progressoUpload = signal<number | null>(null);

enviar(ficheiro: File) {
  this.progressoUpload.set(0);
  this.http
    .post('/upload', ficheiro, { reportProgress: true, observe: 'events' })
    .subscribe((evento) => {
      if (evento.type === HttpEventType.UploadProgress && evento.total) {
        this.progressoUpload.set(Math.round((100 * evento.loaded) / evento.total));
      }
      if (evento.type === HttpEventType.Response) this.progressoUpload.set(null);
    });
}
```

### Manual, sem percentagem conhecida

```html
<evo-progress-bar indeterminate ariaLabel="A processar" />
```

---

## Personalizar

| Token                                       | Controla                                        | Herda de                      |
| ------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| `--evo-progress-bar-height`                 | altura da barra                                 | — (`8px`)                     |
| `--evo-progress-bar-color`                  | cor da barra                                    | `--evo-color-primary`         |
| `--evo-progress-bar-duration`               | duração da transição ao mudar de valor          | `--evo-duration-fast` (120ms) |
| `--evo-progress-bar-z-index`                | posição na pilha de sobreposição                | — (`2147483000`)              |
| `--evo-progress-bar-glow-color`             | cor do brilho na ponta ("peg")                  | `--evo-progress-bar-color`    |
| `--evo-progress-bar-indeterminate-duration` | duração de um ciclo do varrimento indeterminate | — (`1500ms`)                  |

```css
:root {
  --evo-progress-bar-color: #f59e0b;
  --evo-progress-bar-height: 4px;
}
```

```html
<!-- Fica atrás de um cabeçalho fixo com z-index mais alto, só nesta página -->
<evo-progress-bar mode="router" [evoTokens]="{ 'progress-bar-z-index': '500' }" />
```

Não existe token semântico de altura ou de z-index: os valores por omissão
vivem no fallback do `var()`, como o `--evo-switch-thumb-size`.

---

## Acessibilidade

- `role="progressbar"` com `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
  sempre por binding (e ausentes em `indeterminate`, como manda a ARIA
  Authoring Practices) — o NProgress não tem nenhum destes.
- `aria-hidden="true"` enquanto oculta, para não ser anunciada a 0% ou invisível.
- `aria-label` (por omissão "A carregar") — dá nome ao indicador.
- Em `forced-colors` (alto contraste do Windows), a barra usa `CanvasText` e o
  brilho da ponta desaparece (deixaria de haver contraste suficiente).
- **Sem `prefers-reduced-motion`**, ao contrário dos outros componentes da
  toolkit — decisão explícita: o "trickle" e o desvanecer mantêm-se sempre
  animados.

---

## SSR e erros

O `Router` e os temporizadores do modo `router` só correm
`isPlatformBrowser()`; no servidor, o componente simplesmente não faz nada
(fica sempre `data-evo-estado="oculto"`). Sem `@angular/router` registado,
`inject(Router, { optional: true })` devolve `null` e o modo `router` também
não faz nada — só o modo `manual` funciona.

---

## Referência: NProgress

Medido no código-fonte (`nprogress.js`/`nprogress.css`, v0.2.0) e confirmado
visualmente em `ricostacruz.com/nprogress`.

| No NProgress                                                                           | Aqui                                                                                                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Altura `2px`, cor `#29d` fixos                                                         | Tokens, com altura por omissão `8px` (pedido) e cor `--evo-color-primary`                                                                                                |
| `minimum: 0.08` ao arrancar                                                            | Igual: `8%`                                                                                                                                                              |
| Trickle: incrementos `10/4/2/0.5` por faixa de progresso, tecto `99.4%` a cada `200ms` | Igual                                                                                                                                                                    |
| `done()`: salta a 100% e desvanece em `2×speed`, remove o elemento do DOM              | Igual no salto e no desvanecer; o componente Angular nunca é removido, só muda de estado                                                                                 |
| Sem noção de router (é JS puro)                                                        | Modo `router`: `NavigationStart/End/Cancel/Error/Skipped`; **reinicia** a barra numa navegação sobreposta, em vez de continuar o trickle anterior como o NProgress faria |
| Sem nenhum ARIA (`role="bar"`/`"spinner"` não são roles válidos)                       | `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`                                                                                                            |
| Spinner no canto superior direito, por omissão                                         | Deixado de fora — fora do pedido original (só a barra)                                                                                                                   |
| "Peg": brilho de `100px` na ponta da barra                                             | Mantido, como `--evo-progress-bar-glow-color`                                                                                                                            |
| `parent` configurável, detecção de vendor prefix (`translate3d`/`translate`/`margin`)  | Deixados de fora — o Angular resolve "onde fica" pelo template; `transform` sozinho já chega em 2026                                                                     |
| Anima por `transform: translateX()`                                                    | Igual — a técnica em si já é a mais eficiente (só _compositing_, sem refazer layout)                                                                                     |
| Sem `prefers-reduced-motion` nem menção a SSR                                          | A omissão de `prefers-reduced-motion` foi mantida de propósito (pedido); SSR tratado à parte (ver acima)                                                                 |

---

## Ficheiros

```
progress-bar/
├── evo-progress-bar.ts        componente (modos manual/router, integração com o Router)
├── progress-bar.css           estilos (só var(--evo-*), sem declarar --evo-progress-bar-*)
├── progress-bar.tokens.ts     metadados para o Theme Studio
├── progress-bar.preview.ts    pré-visualização no Theme Studio
├── evo-progress-bar.spec.ts   testes (manual, router com navegação real, SSR, regra 1 do CSS)
├── index.ts
└── README.md
```
