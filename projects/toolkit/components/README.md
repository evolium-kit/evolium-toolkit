# @evolium-kit/toolkit/components

Componentes de UI temáveis. Todo o aspecto visual é controlado por CSS custom
properties, para que o mesmo componente possa ser re-estilizado globalmente, por
variante, ou numa única instância — sem fork e sem `::ng-deep`.

---

## Parte 1 — Usar

### Instalação

```bash
npm i @evolium-kit/toolkit
ng add @evolium-kit/toolkit
```

O `ng add` regista os providers e importa a folha de tokens. Para o fazer à mão,
ver [`../theme/README.md`](../theme/README.md). Além do tema, é preciso importar
a folha dos componentes que são directivas:

```css
@import '@evolium-kit/toolkit/styles/evolium-theme.css';
@import '@evolium-kit/toolkit/styles/evolium-components.css';
```

### Componentes disponíveis

| Componente  | Selector                                                    | Variantes                                  | Tamanhos   |
| ----------- | ----------------------------------------------------------- | ------------------------------------------ | ---------- |
| `EvoButton` | `button[evoButton]`, `a[evoButton]`                         | solid, ghost, outline, danger              | sm, md, lg |
| `EvoInput`  | `input[evoInput]`, `textarea[evoInput]`, `select[evoInput]` | —                                          | sm, md, lg |
| `EvoField`  | `evo-field`                                                 | —                                          | —          |
| `EvoCard`   | `evo-card`                                                  | plain, sunken, outlined                    | —          |
| `EvoBadge`  | `evo-badge`                                                 | neutral, primary, success, warning, danger | —          |

```html
<button evoButton variant="danger" size="sm" [loading]="aApagar()">Eliminar</button>

<evo-card variant="sunken">
  <h2 slot="title">Facturas</h2>
  <evo-badge tone="success">Pago</evo-badge>
  <div slot="footer"><button evoButton>Ver todas</button></div>
</evo-card>

<evo-field>
  <label for="email">Email</label>
  <input evoInput id="email" type="email" [invalid]="erro()" aria-describedby="email-erro" />
  @if (erro()) {
  <span slot="error" id="email-erro">Email inválido.</span>
  }
</evo-field>
```

`EvoButton` e `EvoInput` aplicam-se a elementos nativos em vez de os embrulhar:
mantêm semântica, foco, validação nativa, `formControlName` e o preenchimento
automático do browser intactos.

### Registar os componentes no Theme Studio

```ts
import { provideEvoComponents } from '@evolium-kit/toolkit/components';

providers: [provideEvoComponents()];
```

### Exemplo completo

```ts
import { Component } from '@angular/core';
import { EvoButton } from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';

@Component({
  selector: 'app-exemplo',
  imports: [EvoButton, EvoTokensDirective],
  template: `
    <!-- 1. Aspecto padrão -->
    <button evoButton>Guardar</button>

    <!-- 2. Variante nomeada: reutilizável em toda a aplicação -->
    <button evoButton variant="ghost">Cancelar</button>
    <button evoButton variant="danger" size="sm">Eliminar</button>

    <!-- 3. Estado -->
    <button evoButton [loading]="aGravar()" [disabled]="!formValido()">Submeter</button>

    <!-- 4. Override de uma única instância -->
    <button evoButton [evoTokens]="{ 'button-bg': '#0d9488', 'button-radius': '2px' }">
      Só este é verde
    </button>

    <!-- 5. Override de toda uma subárvore, sem tocar em nenhum componente -->
    <section [evoTokens]="{ 'color-primary': '#7c3aed' }">
      <button evoButton>Herda roxo</button>
      <evo-card>
        <button evoButton>Este também</button>
      </evo-card>
    </section>
  `,
})
export class Exemplo {}
```

### Como a personalização se resolve

Para um dado elemento, o valor de um token é decidido nesta ordem, da mais forte
para a mais fraca:

| #   | Origem                                       | Alcance                              |
| --- | -------------------------------------------- | ------------------------------------ |
| 1   | `[evoTokens]` no próprio componente          | aquela instância                     |
| 2   | `data-evo-variant`                           | todas as instâncias daquela variante |
| 3   | `[evoTokens]` num ancestral                  | aquela subárvore                     |
| 4   | `:root` no `styles.css` do projecto          | aplicação inteira                    |
| 5   | `:root` escrito pelo Theme Studio em runtime | aplicação inteira                    |
| 6   | fallback do `var()` no CSS do componente     | omissão da toolkit                   |

Os níveis 1 a 3 resolvem-se por **herança**, não por especificidade: o valor de
um elemento é o que ele próprio declara, senão o do pai. É por isso que o nível 3
funciona sem nenhum selector mencionar o componente.

---

## Parte 2 — Acrescentar um componente novo

### Preferir o gerador

```bash
ng g @evolium-kit/toolkit:ui-component <nome> --dry-run   # ver o que vai ser criado
ng g @evolium-kit/toolkit:ui-component <nome>
```

### Ficheiros obrigatórios

```
components/src/lib/<nome>/
├── evo-<nome>.ts          componente
├── <nome>.css             estilos (só var(--evo-*))
├── <nome>.tokens.ts       metadados para o Theme Studio
├── evo-<nome>.spec.ts     testes
└── index.ts               re-export
```

E o `export * from './lib/<nome>';` em `src/public-api.ts`.

### As duas regras de ouro do CSS

Violar qualquer uma delas parte o sistema **em silêncio** — sem erro de build,
sem aviso na consola. São o ponto mais importante deste documento.

**Regra 1 — nunca declarar o token do próprio componente.** O valor por omissão
vive no argumento de fallback do `var()`:

```css
@layer evo.components {
  .evo-button {
    /* CERTO */
    background-color: var(--evo-button-bg, var(--evo-color-primary));
    border-radius: var(--evo-button-radius, var(--evo-radius-md));
  }

  /* ERRADO — isto ganha por proximidade a qualquer :root do projecto,
     e torna o override global impossível:
  .evo-button { --evo-button-bg: blue; }
  */
}
```

**Regra 2 — nunca registar tokens de componente com `@property`.** Uma custom
property registada com `initial-value` deixa de ser _guaranteed-invalid_, e
`var(--evo-button-bg, X)` para de usar `X`. A cascata de fallback morre sem dar
sinal. `@property` só é admissível em tokens primitivos ou semânticos, e só
quando for mesmo preciso animar o valor.

### Contrato do componente

- Classe `Evo<Nome>`, selector `evo-<nome>` (ou `button[evoNome]` para componentes
  que se aplicam a um elemento nativo).
- `changeDetection: ChangeDetectionStrategy.OnPush`.
- API pública só com `input()`, `input.required()`, `output()`, `model()`.
  Nunca os decoradores `@Input`/`@Output`; para referências use `viewChild()`/`contentChild()`.
- Estado interno em `signal()`, derivações em `computed()`. Nunca um `effect()`
  para sincronizar dois signals — isso é `linkedSignal()`.
- Variantes e estados expostos como atributos no host, nunca como `ngClass`:

```ts
host: {
  class: 'evo-<nome>',
  '[attr.data-evo-variant]': 'variant()',
  '[attr.data-evo-size]': 'size()',
  '[attr.data-evo-loading]': 'loading() ? "" : null',
  '[attr.aria-busy]': 'loading() ? "true" : null',
}
```

- Tipos de variante com `(string & {})` na union, para aceitar variantes que o
  projecto consumidor definiu no seu próprio CSS sem alterar a toolkit.
- Zero cores, medidas ou tipografia literais no CSS. Tudo por `var(--evo-*)`.
  A única excepção são valores estruturais sem significado visual (`display: flex`).

### Antes de escrever uma primitiva

Verificar se o `@angular/cdk` já a tem. **Nunca reimplementar** posicionamento de
overlay, focus trap, scroll lock, roving tabindex ou anúncios de leitor de ecrã:

| Precisa de                 | Usar                                |
| -------------------------- | ----------------------------------- |
| dropdown, tooltip, popover | `Overlay`, `OverlayPositionBuilder` |
| modal                      | `Dialog`, `FocusTrap`               |
| lista com teclado          | `CdkListbox`, `ListKeyManager`      |
| menu                       | `CdkMenu`                           |
| tabela                     | `CdkTable`                          |
| anúncios a11y              | `LiveAnnouncer`                     |

### SSR

Nada de `window`, `document`, `localStorage` ou `navigator` no construtor nem em
`ngOnInit`. Medições de DOM vão em `afterNextRender()`. Se precisar mesmo de
ramificar, `isPlatformBrowser(inject(PLATFORM_ID))`.

**Não ramificar o template por tema.** `@if (scheme() === 'dark')` renderiza
`light` no servidor e `dark` no cliente, o que dá erro de hidratação (NG0500).
Toda a diferença claro/escuro é CSS.

### Acessibilidade — critério de aceitação, não extra

- Role e atributos ARIA correctos, sempre por binding.
- Navegação completa por teclado: Tab, setas, Enter, Espaço, Escape, Home/End.
- Foco visível através de `--evo-focus-ring-*`; nunca `outline: none` sem substituto.
- Alvos de toque de pelo menos 44×44 px.
- Contraste mínimo 4.5:1 para texto e 3:1 para limites de controlos (WCAG 1.4.11).

### Metadados para o Theme Studio

Sem este ficheiro o componente não aparece no Studio. Os controlos do painel
direito são gerados a partir daqui — nenhum painel é escrito à mão:

```ts
// <nome>.tokens.ts
import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

export const buttonMeta: EvoComponentMeta = {
  id: 'button',
  label: 'Button',
  category: 'Básicos',
  tags: ['acção', 'formulário', 'cta'],
  variants: ['solid', 'ghost', 'outline', 'danger'],
  sizes: ['sm', 'md', 'lg'],
  preview: () => import('./button.preview').then((m) => m.ButtonPreview),
  tokens: [
    { name: 'button-bg', label: 'Cor de fundo', type: 'color', fallback: '--evo-color-primary' },
    { name: 'button-fg', label: 'Cor do texto', type: 'color', fallback: '--evo-color-on-primary' },
    {
      name: 'button-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-md',
    },
  ],
};
```

Cada token declarado no `.tokens.ts` tem de existir mesmo no CSS, e vice-versa.

### Onde o CSS tem de viver

Regra prática, descoberta a construir estes componentes:

| O que se estiliza                                 | Onde                                         |
| ------------------------------------------------- | -------------------------------------------- |
| O próprio host e o template do componente         | `styleUrl` encapsulado, com `:host`          |
| Conteúdo **projectado** (`ng-content`)            | folha global `styles/evolium-components.css` |
| Componentes que são **directivas** (sem template) | folha global                                 |

A razão: com `ViewEncapsulation.Emulated`, o conteúdo projectado recebe o
atributo do componente **pai**, não o do componente que o projecta. Um
`styleUrl` encapsulado nunca alcança um `<label>` passado por `ng-content` — e
`::slotted()` não ajuda, porque é para shadow DOM real. Foi por isto que os
estilos de `evo-field` e do `[slot=title]` do `evo-card` vivem na folha global.

### Testes

Um `.spec.ts` por componente, com Vitest e `TestBed`. Cobertura mínima:

- render por omissão;
- cada `input()` reflectido no DOM;
- cada `output()` emitido nas condições certas;
- atributos ARIA em cada estado, e que **não ficam para trás** ao sair dele;
- navegação por teclado, se houver.

**Limitação importante do ambiente de teste.** O jsdom, que o
`@angular/build:unit-test` usa, **não resolve `var()` nem interpreta `@layer`**:
`getComputedStyle` devolve o texto literal `var(--x, y)` e ignora tudo o que
esteja dentro de uma camada. Um teste de cascata por estilo computado passaria
sempre sem medir nada.

Por isso a Regra 1 é verificada sobre o **texto** do CSS injectado — que nenhum
`--evo-<nome>-*` é declarado fora de `@layer evo.variants` — e a cascata a sério
valida-se no browser, no playground em `src/app`. Ver
`button/evo-button.spec.ts` para o padrão.

### Antes de dar por concluído

```bash
npm run build:lib
npm run test:lib
npx prettier --write projects/toolkit/components
```

E acrescentar o componente à secção "Usar" deste README, com um exemplo
copiável. **Um componente sem entrada no README não está pronto.**
