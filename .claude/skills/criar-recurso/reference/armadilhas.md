# Armadilhas ao construir componentes na toolkit

Cada ponto custou tempo numa construção real (EvoMenu, EvoTextField `autoComplete`,
EvoSelect, EvoModal). Lê antes da Fase 4.

## Primitivas do CDK (menu, listbox, overlay, dialog)

- **Declarar onde o CDK procura.** `CdkMenu` encontra os itens por `ContentChildren` e os itens
  encontram o menu por injecção (`CDK_MENU`); ambas se resolvem onde os itens são **declarados**,
  não onde são desenhados. A forma que funciona é um componente com a primitiva como
  `hostDirectives` e os itens como **filhos directos** dele, dentro de um `<ng-template>` que o
  gatilho desenha. Duas formas parecem certas e perdem silenciosamente setas, typeahead e
  Home/End: projectar os itens por `<ng-content>` para um `div[cdkMenu]` interno, e desenhá-los
  por um `ngTemplateOutlet` declarado noutro sítio. Por isso, por dados, a recursão dos
  submenus faz-se **por gatilhos** (cada nível é um gatilho com o seu array), não por template
  recursivo nem por componente filho.
- **Spike primeiro.** Antes do resto: um teste que prove setas, Escape a devolver o foco e um
  submenu, e uma verificação no navegador.
- **Campos protegidos do CDK**: acessíveis por `obj['campo']`, mas estão fora da API pública.
  Usa-os só onde não há alternativa (ex.: `closeOnSpacebarTrigger`) e comenta porquê. Para
  actualizar a posição de um overlay já criado, chama `ngOnChanges({ menuPosition: new
SimpleChange(...) })` em vez de mexer no `overlayRef`.
- **Atribuir um `TemplateRef` por código** (`menuTemplateRef`) tem de acontecer antes do
  primeiro clique: sem ele o CDK não abre e o `aria-haspopup` não aparece. `markForCheck()`
  depois, porque os host bindings do CDK leem campos simples.
- **`hostDirectives`**: expor um input do CDK com `inputs: ['nomeCdk: alias']`; um alias igual
  ao de um input do próprio componente rebenta. O `id` de `CdkMenu` é um host binding: sem o
  expor, um `id` posto no elemento é substituído.
- **Selectores Angular não têm combinador de filho** (`pai > filho` não existe): para uma
  directiva "só dentro de X", injecta o pai com `inject(Pai, { optional: true })`.
- **`disabled` numa directiva sobre `<button>`**: um `disabled` estático põe o atributo nativo e
  tira o botão do foco. Se o item deve ficar focável, anula com `'[attr.disabled]': 'null'`.
- **`@switch` do template não estreita uma união com discriminante opcional**: usa métodos
  auxiliares que fazem o `as`.

## Overlays no `<body>`

- **Tokens**: um painel no overlay não herda os `[evoTokens]` do gatilho nem dos ancestrais.
  Copia-os ao abrir com `tokensEmLinha(elemento)` (hoje em `modal/modal-overlay.ts`; o `drawer`
  tem uma cópia) e re-copia a cada abertura. Os submenus herdam pelo painel pai.
- **Escape dentro de um modal/drawer**: o despachante de teclado do CDK entrega o Escape ao
  `Dialog` por baixo, e o menu fecharia os dois. Um `(keydown.escape)` no próprio painel **não
  chega**: o `CdkMenu` fecha e destrói o painel (e os ouvintes dele) no mesmo evento. Põe o
  ouvinte no `.cdk-overlay-pane` (`host.parentElement`), que sobrevive, e `stopPropagation`.
- **Tab com o painel aberto**: o painel está no fim do `<body>`, por isso um Tab "normal"
  sairia do documento. O `CdkMenu` fecha e devolve o foco ao gatilho **sem** `preventDefault`,
  e o Tab continua dali (confirmado no Chrome).
- **Abrir por código** não move o foco para dentro: chama `focusFirstItem('program')` depois de
  `open()`, ou o teclado (e o Escape) nunca lhe chega.
- Usar `usePopover: 'inline'` (como o `evo-select`) dá a herança de tokens de graça, mas o
  `CdkMenuTrigger` não o expõe.

## Testes (Vitest + jsdom)

- O CDK lê `event.keyCode` para setas, Enter, Espaço, Tab e Escape: um `KeyboardEvent` só com
  `key` não faz nada. Cria o evento e define `keyCode` com `Object.defineProperty`. O typeahead
  lê `key` (um carácter) e usa um `debounce` real: espera ~260 ms.
- `@angular/cdk/testing/testbed/fake-events` **não** está exposto; escreve o auxiliar.
- Um `Event` de ponteiro que o CDK ouve: `pointerdown` seguido de `click` no `document.body`.
- O foco programático (`.focus()`) não actualiza o `FocusKeyManager`: para testar setas num
  menu embutido, foca o **painel** (o `FocusMonitor` leva o foco ao 1.º item).
- Depois de `.focus()` é preciso `fixture.detectChanges()` antes de ler `tabindex` (host binding).
- Os testes de CSS fazem-se sobre o **texto** das folhas injectadas (Regra 1, paridade
  `.tokens.ts` ↔ CSS, ausência de `@property`); `var()` e `@layer` só se validam no navegador.
- `[evoTokens]` nos testes importa de `@evolium-kit/toolkit/core` e resolve pelo `dist`.

## Playground e servidor de desenvolvimento

- A app resolve `@evolium-kit/toolkit/*` por `tsconfig` para `dist/toolkit/*`: antes de
  `npx ngc -p tsconfig.app.json --noEmit` ou de `ng serve`, corre `npm run build:lib` (ou deixa
  `npm run watch:lib` a correr). O `ng serve` guarda o `dist` em cache de pré-empacotamento:
  **reinicia-o** depois de cada alteração à biblioteca, ou continuas a testar código velho
  (confirma com `ng.getComponent(el)` na consola: o método novo existe?).
- Usa uma porta tua (ex.: 4521) e pára-a no fim; as portas 4200/4300 são de outros projectos.
- Se o ambiente da shell for PowerShell, `Set-Location` persiste entre chamadas: faz `cd` à
  raiz do repositório no início de cada comando.

## Estilo e API

- CSS partilhado por várias peças (painel, item, grupo…): um só `menu.css` como `styleUrl` de
  todas, cada uma com o seu `:host(.evo-<nome>-<parte>)`. Conteúdo projectado nos itens (ícones,
  atalhos) vai para a folha global.
- Tamanhos: declaram tokens dentro de `@layer evo.variants`, no painel; os itens herdam.
- Um `effect()` só é aceitável para empurrar estado para um objecto imperativo (CDK) ou para um
  efeito colateral que emite um output; nunca para sincronizar dois signals (`linkedSignal`).
  Comenta a excepção no código.
- Nomes de inputs de **directivas** que se aplicam a qualquer elemento levam prefixo
  (`evoMenuPlacement`, não `placement`), para não colidir com outras directivas.
- Não afirmes comportamento do navegador que não mediste — nem em comentários, nem no README.

## Encoding

Os ficheiros são UTF-8. Ao escrever por PowerShell usa `[IO.File]::WriteAllText(..., (New-Object
Text.UTF8Encoding($false)))` (sem BOM); `Get-Content` na consola pode mostrar acentos trocados
sem que o ficheiro esteja errado — confirma com a ferramenta `Read`.
