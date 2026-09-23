# @evolium-kit/toolkit/core

Camada base: tipos, tokens de DI e utilitários. **Não depende de mais nenhum
entry point da toolkit**, e é a única que todas as outras podem importar.

Esta regra é o que impede ciclos entre entry points e mantém o tree-shaking. Se
algo em `/core` precisar de importar de `/theme` ou `/components`, esse algo não
pertence a `/core`.

---

## Parte 1 — Usar

### `EvoTokensDirective`

Aplica tokens de tema a um elemento e, por herança, a toda a sua subárvore. A
mesma directiva serve os dois eixos de personalização:

```ts
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';

@Component({
  imports: [EvoTokensDirective],
  template: `
    <!-- instância isolada -->
    <button evoButton [evoTokens]="{ 'button-bg': '#0d9488' }">Só este</button>

    <!-- subárvore inteira, sem tocar em nenhum componente -->
    <section [evoTokens]="{ 'color-primary': '#7c3aed', 'radius-md': '12px' }">
      <evo-card>…</evo-card>
    </section>
  `,
})
```

Aceita a forma curta (`button-bg`) ou completa (`--evo-button-bg`). Um valor
`null` remove o token, deixando-o voltar ao que herdaria.

Usa `Renderer2` e não `element.style`, para que o override seja serializado no
HTML servido em SSR — sem isso haveria um flash na hidratação.

### Utilitários de token

```ts
import {
  declarations,
  isSafeTokenName,
  isSafeTokenValue,
  normalizeTokenName,
  normalizeTokens,
} from '@evolium-kit/toolkit/core';

normalizeTokenName('color-primary'); // '--evo-color-primary'
normalizeTokenName('--evo-color-primary'); // inalterado

declarations({ '--evo-color-primary': '#2563eb' }); // '--evo-color-primary:#2563eb;'
```

`declarations()` descarta em silêncio nomes e valores inválidos. É deliberado:
um token inválido nunca deve impedir o resto do tema de ser aplicado.

### Tipos e tokens de DI

| Símbolo                                       | Papel                                    |
| --------------------------------------------- | ---------------------------------------- |
| `EvoThemeSnapshot`                            | estado serializável de um tema           |
| `EvoTokenRecord`, `EvoVariantRecord`          | mapas de tokens                          |
| `EvoColorScheme`                              | `'light' \| 'dark' \| 'system'`          |
| `ThemePersistence`                            | contrato das estratégias de persistência |
| `EVO_THEME_PERSISTENCE`, `EVO_THEME_DEFAULTS` | tokens de DI                             |
| `EvoComponentMeta`, `EVO_COMPONENT_META`      | metadados para o Theme Studio            |

### Registar um componente no Theme Studio

```ts
import { provideEvoComponentMeta } from '@evolium-kit/toolkit/core';

providers: [provideEvoComponentMeta(buttonMeta, cardMeta)];
```

---

## Parte 2 — Acrescentar a `/core`

### Critério de admissão

Algo pertence a `/core` se, e só se, satisfizer as três condições:

1. é usado por **dois ou mais** entry points;
2. não importa de nenhum outro entry point da toolkit;
3. não depende de `@angular/cdk`, `@angular/router` nem `@angular/common/http`.

Falhando qualquer uma, pertence ao módulo que o usa. Em caso de dúvida, deixar
fora de `/core`: mover para cá mais tarde é trivial, tirar daqui é uma breaking
change para todos os consumidores.

### Contrato de segurança

`isSafeTokenName` e `isSafeTokenValue` são a **única** barreira entre valores
vindos do Theme Studio (ou de um backend) e um `<style>` injectado no documento.
O `DomSanitizer` não protege `textContent` de um `<style>`: um valor como
`red}</style><script>…` escaparia do bloco.

Qualquer alteração a `token-utils.ts` exige testes que cubram explicitamente as
tentativas de escape (`<`, `>`, `{`, `}`, `\`, `@import`, `url(`, `expression(`).

### Regras gerais

- Nada em `/core` toca no DOM directamente. A única excepção é a
  `EvoTokensDirective`, e mesmo essa só via `Renderer2`.
- Funções puras sempre que possível — são o que dá para testar sem `TestBed`.
- `Promise` e não `Observable` nas APIs one-shot, para não arrastar RxJS para cá.
- Tipos com `Readonly`/`readonly` por omissão.
- Acesso por bracket em mapas indexados (`record['chave']`), por causa do
  `noPropertyAccessFromIndexSignature` que está activo no workspace.
