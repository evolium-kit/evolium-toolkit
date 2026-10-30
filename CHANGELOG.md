# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

## [0.3.5] - 2026-10-30

### Adicionado

- **`EvoTabs`** (`evo-tabs` + `evo-tab-list` + `evoTab` + `evo-tab-panel`), em
  `@evolium-kit/toolkit/components`: alterna vistas persistentes sem overlay,
  construído do zero (sem modelo), medido ao vivo no `Tabs` do Joy UI
  (`mui.com/joy-ui/react-tabs/`). Selecção manual por omissão — as setas só
  movem o foco (roving tabindex por `FocusKeyManager` do CDK, com wrap),
  Enter/Espaço selecciona — ou automática com `selectionFollowsFocus`. Home/End
  vão às extremidades; só o eixo da `orientation` (`horizontal`/`vertical`)
  responde; uma tab `disabled` é saltada pelas setas (correcção face à
  referência, que a deixa focável). `size` sm/md/lg, `[tabs]` por dados (gera
  só os botões), `scrollable`, `sticky`, `disableUnderline` no `evo-tab-list`,
  `keepMounted` por `evo-tab-panel` (preserva estado ao trocar de tab). O
  painel tem sempre `tabindex="0"` (recomendação da APG; a Joy não o põe).
  `aria-controls`/`aria-labelledby` cruzados entre tab e painel sem registo
  central (derivados do `value` de cada um). 13 tokens `--evo-tabs-*`.
  Documentação em `components/src/lib/tabs/README.md`.

## [0.3.4] - 2026-10-27

### Adicionado

- **`EvoMenu`** (`evo-menu`), em `@evolium-kit/toolkit/components`: menu de acções
  sobre o `CdkMenu` — um gatilho (`[evoMenuTriggerFor]`) abre um painel de itens
  com teclado completo (setas, Home/End, escrita rápida, Escape e Tab devolvem o
  foco). Itens `evoMenuItem` (botão ou ligação, `disabled`, `selected` com
  `aria-current`), `evoMenuCheckbox`, `evoMenuRadio` com `evo-menu-group`,
  `evoMenuSeparator`, ícone e atalho por `slot="prefix"`/`"suffix"`, submenus a
  qualquer profundidade, `evo-menu-bar` (barra de menus), menu de contexto
  (`[evoContextMenuTriggerFor]`), menu embutido (`<evo-menu>` sem gatilho) e
  desenho por dados (`[evoMenuTriggerFor]="entradas"`). `evoMenuPlacement`/
  `evoMenuOffset` (vira sozinho junto à borda), `[(evoMenuOpen)]`,
  `evoMenuOpened`/`evoMenuClosed`, `size` sm/md/lg (o submenu herda) e
  `closeOnSelect` por item. 17 tokens `--evo-menu-*`; os `[evoTokens]` do gatilho
  e dos ancestrais são copiados para o painel (que vive no overlay). O painel é
  nomeado pelo gatilho, o Escape do menu não fecha o `evo-modal`/`evo-drawer`
  onde esteja, o painel acompanha o gatilho no scroll e os itens têm 44 px com
  ponteiro táctil. Medido no `Menu` do Joy UI: mantém o que lá funciona e
  corrige o painel sem nome e o Tab a perder o foco.

- **`EvoTextField` com `type="autoComplete"`**: o próprio `<input>` passa a ser
  o combobox, com um painel de sugestões por baixo — a alternativa ao
  `searchable` do `evo-select`, sem botão-gatilho nem caixa de pesquisa dentro
  do painel. Usa as `options` do `evo-select` (`EvoSelectOption`: `sublabel`,
  `icon`, `group`, `disabled`, template por opção com `evoSelectOption`) e o
  mesmo desenho de painel, por isso lê os `--evo-select-panel-*` e
  `--evo-select-option-*`: não acrescenta tokens. Inputs novos: `options`,
  `freeSolo`, `loading`, `autoHighlight`, `openOnFocus`, `compareWith`,
  `searchFn`; outputs `searchChange` e `openedChange`. Por omissão o
  formulário recebe o `value` da opção (como o `evo-select`); com `freeSolo`,
  o texto. Apagar o texto limpa o valor logo; sair do campo com texto que não
  era uma escolha repõe o nome da escolha. Teclado completo (`↓`/`↑`, `Enter`,
  `Esc`, `Alt`+`↑`), `aria-activedescendant` com o foco sempre no campo, e
  `autocomplete="off"` forçado. Comportamento medido no `Autocomplete` do Joy
  UI; fica de fora o `multiple` com etiquetas, "Adicionar «x»", a virtualização
  e a conclusão em linha. Mensagens novas em `EvoTextFieldMessages`:
  `noResults`, `loading`, `openOptions`, `closeOptions`.

### Alterado

- **`EvoTextField` é agora genérico** (`EvoTextField<V = string, D = unknown>`).
  Os valores por omissão mantêm tudo como estava: quem escreve `EvoTextField`,
  `[(value)]` com um `signal<string>` ou `viewChild(EvoTextField)` não muda nada.
- Um `EvoTextField` desactivado (ou só de leitura) com o painel aberto fecha-o.

## [0.3.3] - 2026-10-23

### Adicionado

- **`EvoDrawer`** (`evo-drawer`) e **`EvoDrawerService`**, em
  `@evolium-kit/toolkit/components`: painéis sobrepostos que entram de um dos
  lados do ecrã, migrados de `app-drawer-overlay`. Duas formas com o mesmo
  aspecto e os mesmos tokens — `<evo-drawer>` declarativo, aberto por
  `[(open)]`, e `EvoDrawerService.open()` por código, com componente,
  `TemplateRef` ou só título/mensagem/acções, dados e resultado tipados
  (`EvoDrawerRef<R, E>`, `injectDrawerRef()`, `EVO_DRAWER_DATA`). Assenta no
  `Dialog` do `@angular/cdk` (focus trap, Escape, bloqueio do scroll,
  devolução do foco, `aria-modal`). `position` (`left`/`right`/`top`/
  `bottom`), `size` (`sm`/`md`/`lg`/`full`/custom), `backdrop`,
  `closeOnBackdrop`, `closeOnEscape`, `showClose`, `beforeClose` (assíncrono),
  `(closed)` com o motivo (`escape`, `backdrop`, `close-button`,
  `programmatic`, `navigation`), slots `slot="header"`/`slot="footer"`,
  acções do rodapé com `loading` e erro mostrado no drawer, abertura pelo
  fragmento da URL com `provideEvoDrawers({ fragments })`, e
  `provideEvoDrawerMessages()`. 17 tokens `--evo-drawer-*`, copiados dos
  `[evoTokens]` do host e dos ancestrais para o overlay ao abrir (como no
  `EvoModal`). Documentação em `components/src/lib/drawer/README.md`.

## [0.3.2] - 2026-10-16

### Adicionado

- **Entry point `@evolium-kit/toolkit/crud`**: CRUD de entidades sobre
  TanStack Query (`@tanstack/angular-query-experimental`, peer opcional — só
  quem importa este entry point o instala), migrado de `crud-kit`.
  `injectCrudResource()` lista, cria, actualiza e apaga com cache e
  revalidação (`items`, `meta`, `loading`, `error`, `one()` com
  `cache-only`/`fetch-on-miss`, adaptadores de resposta);
  `injectCrudController()` abre o formulário de criar/editar em modal
  (`EvoModalService`) ou numa rota, e apaga com confirmação;
  `injectCrudForm()` liga os erros de campo da API ao `FormGroup`
  (`bindErrors`) e dá o `formError`; `injectCrudPage()` resolve o registo de
  uma rota `/:id`. Hooks (`afterList`, `before*`/`after*`, `onError`,
  `beforeOpenForm`, `afterCloseForm`) locais ou globais por
  `withPlugin(crudPlugin(), { hooks })`, e três prontos: `crudToasts()`,
  `crudSoftDelete()` e `crudInvalidate()`. Os pedidos passam pelo kernel de
  `/services` (`baseUrl`, Bearer do `authPlugin()`, `EvoError`). Documentação
  em `crud/README.md`.

- **`EvoDataTable`** (`evo-data-table`), em `@evolium-kit/toolkit/components`:
  tabela de dados migrada de `data-tabela-generica-v2`, sobre o `CdkTable`
  (`<table>`/`<th>`/`<td>` nativos). Três formas de dar os dados: `[data]` em
  memória (a tabela pesquisa, ordena e pagina), `[source]` — uma função
  `(query, abortSignal) => Promise | Observable<{ items, total }>` que a
  tabela chama a cada página, com debounce da pesquisa (300ms), cancelamento
  de pedidos obsoletos, linhas-esqueleto no primeiro carregamento, barra fina
  nos seguintes, erro com "Tentar de novo", `reload()` e correcção de uma
  página que deixou de existir — e `paging="server"` + `[total]`, em que o pai
  carrega e a tabela só emite `[(page)]`, `[(pageSize)]`, `[(search)]` e
  `[(sort)]`. Ordenação por coluna (`aria-sort`; números, datas e texto pela
  ordem local), pesquisa sem acentos (`searchFn` sobreponível), selecção entre
  páginas (`selectable`, `[(selection)]`, "seleccionar página"), linhas
  expansíveis (`<ng-template evoRowDetail>`), templates de célula e de acções
  tipados (`evoCell`, `evoRowActions`), clique na linha por rato e teclado
  (`rowClickable`, `(rowClick)`), `rowKey`, `pageSizeOptions`,
  `stickyHeader`/`maxHeight`, `size`, slots `toolbar-start`/`toolbar-end`/
  `summary`/`footer-start`/`empty`/`error`, e anúncio dos resultados por
  `LiveAnnouncer`. Com `source`, não pede nada no render do servidor salvo
  `ssr`. Textos por `provideEvoDataTableMessages()`. 19 tokens
  `--evo-data-table-*`, incluindo a borda externa e o separador das linhas
  (cor e espessura). Também exportados `EvoDataTableColumn`,
  `EvoDataTableSource`, `EvoDataTablePage`, `EvoDataTableQuery`,
  `EvoDataTableSort` e `evoSortParam()` (`'nome,desc'`). Documentação em
  `components/src/lib/data-table/README.md`.
- **`EvoPagination`** (`evo-pagination`), em `@evolium-kit/toolkit/components`:
  paginação usada pela tabela e também usável sozinha. Mostra sempre o mesmo
  número de botões, com reticências, para os botões não mudarem de sítio. Tem
  `[(page)]`, `[(pageSize)]`, `length`, `pageSizeOptions`, `showSummary`
  ("A mostrar 1–10 de 124"), `siblings`/`boundaries`, `hideSinglePage`,
  `disabled` e `size`; `aria-current="page"` e alvos de toque de 44px. A
  função `evoPageItems()` é exportada. Textos por
  `provideEvoPaginationMessages()`. 6 tokens `--evo-pagination-*`.
  Documentação em `components/src/lib/pagination/README.md`.

## [0.3.1] - 2026-10-16

### Adicionado

- **`EvoModal`** (`evo-modal`) e **`EvoModalService`**, em
  `@evolium-kit/toolkit/components`: modal declarativo por `[(open)]` e
  serviço com `open()` (componente, `TemplateRef` ou mensagem com acções),
  `alert()`/`success()`/`error()`/`warning()`/`info()`, `confirm()` →
  `boolean` e `prompt()`. Migrado de `AlertModalService` + `ModalGenerico`.
  Assenta no `Dialog` do `@angular/cdk` (focus trap, Escape, bloqueio do
  scroll, devolução do foco, `aria-modal`). Tamanhos, `position`, tons com
  ícone (ou `slot="icon"` próprio), `beforeClose`, acções assíncronas com
  `loading` e erro no modal, `EvoModalRef<R, E>` tipado com `EVO_MODAL_DATA`
  / `injectModalRef()` / `emit()`, abertura pelo fragmento da URL com
  `provideEvoModals({ fragments })`, `provideEvoModalMessages()` e
  `prefers-reduced-motion`. 25 tokens `--evo-modal-*`; os `[evoTokens]` do
  host e dos ancestrais são copiados para o overlay ao abrir.

### Corrigido

- **`npm run publicar`**: erros de validação do CHANGELOG (secção
  `[Não publicado]` ausente ou vazia) saem como mensagem `✖`, sem stack trace.

## [0.3.0] - 2026-10-15

### Adicionado

- **`AGENTS.md` no pacote**: índice da toolkit para agentes de IA (Claude Code,
  Cursor…), gerado em cada build a partir do código e dos `.d.ts` — entry
  points, componentes com selector, inputs (tipo e omissão) e tokens, layouts,
  páginas, tokens de tema, geradores, API pública e regras de uso. O pacote
  passa também a levar `docs/getting-started.md`, `docs/theming.md`,
  `docs/plugins.md` e o `CHANGELOG.md`.
- **`ng g @evolium-kit/toolkit:ai-context`** (alias `ai`), também corrido pelo
  `ng add` (nova pergunta, sim por omissão): cria a skill do Claude Code
  `.claude/skills/evolium-toolkit/SKILL.md` e um bloco entre marcadores no
  `CLAUDE.md`, que mandam o agente ler o `AGENTS.md` da versão instalada.
  Idempotente. Ver `docs/ai-context.md`.

- **`npm run publicar -- --version vX.Y.Z`** (e `/publicar` no Claude Code):
  valida o repositório, mostra a versão anterior e a nova e pede confirmação,
  actualiza a versão e o CHANGELOG, corre a pipeline do `release.yml` e envia
  o commit e a tag com `git push --atomic`. Ver `docs/contributing.md`.

## [0.2.1] - 2026-10-15

### Adicionado

- **`EvoSelect`** (`evo-select`), em `@evolium-kit/toolkit/components`: lista
  de escolha simples ou múltipla, migrada de `field-select-v2`. Compõe
  `EvoField` + `evo-input` e implementa `ControlValueAccessor` (também
  `[(value)]`). Valor de qualquer tipo, com `compareWith` (números chegam ao
  formulário como números). Pesquisa sem acentos e fixa no topo do painel,
  grupos (`group`), ícones (imagem ou fonte, por `iconClass`), segunda linha
  (`sublabel`), template tipado `<ng-template evoSelectOption>` (aceita também
  `#optionTemplate`), `clearable`, `loading`, `selectAll`, `maxLabels`, e
  pesquisa no servidor com `[searchFn]="null"` + `(searchChange)`. Erro
  automático do controlo com as mensagens do text-field; textos por
  `provideEvoSelectMessages()`. Padrão combobox/listbox da APG com teclado
  completo (`ActiveDescendantKeyManager`). O painel é um overlay do CDK em
  popover inline: nunca é cortado por `overflow: hidden` e herda os
  `[evoTokens]`. 26 tokens `--evo-select-*`; os de estado caem primeiro nos
  `--evo-text-field-*`. Documentação em `components/src/lib/select/README.md`.

## [0.2.0] - 2026-10-14

### Adicionado

- **`EvoTextField`** (`evo-text-field`), em `@evolium-kit/toolkit/components`:
  campo de texto completo que compõe `EvoField` + `evo-input`. Implementa
  `ControlValueAccessor` e funciona também sozinho com `[(value)]`. Mostra o
  erro do controlo automaticamente (mensagens configuráveis com
  `provideEvoTextFieldMessages()`), lê o `required` dos validadores, e tem
  `hint`, `size`, `hideLabel`, mostrar/ocultar senha, `clearable`,
  `showCount` e textarea com `autoResize`. 11 tokens `--evo-text-field-*`;
  `--evo-text-field-ring-offset` vale `0` por omissão (anel encostado à
  borda). Documentação em `components/src/lib/text-field/README.md`.
- **`[evoTokens]` tipado** (`EvoTokenMap`, `EvoTokenName`, `EvoTokenNames` em
  `/core`): o editor completa os nomes de todos os tokens da toolkit, e um nome
  curto desconhecido num objecto literal é erro de compilação (por exemplo
  `'ring-width'` em vez de `'text-field-ring-width'`). A lista é gerada do CSS
  no build; uma aplicação acrescenta os seus tokens com `declare module`.

- **Theme Studio: pré-visualização num `<iframe>`.** Cada componente é
  desenhado na rota `<path>/preview` (registada por `evoThemeStudioRoutes()`),
  isolado do CSS do Studio. A selecção, a variante, o tamanho e as edições de
  tokens chegam-lhe por `postMessage`, sem recarregar.
- **Theme Studio: documentação do componente**, vinda do `README.md` da pasta
  e mostrada por baixo da pré-visualização.
- **`EvoComponentMeta.docs`**, que devolve o HTML da documentação.
- **`EvoThemeStore.adopt(state)`**, que substitui o estado inteiro sem marcar
  `dirty`. Um `restore()` que termine depois é ignorado.
- **Registo automático dos componentes da toolkit.**
  `tools/generate-component-registry.mjs` descobre-os pelas pastas, junta o
  `<nome>.preview.ts` e o `README.md` convertido em HTML (com o `marked`, só no
  build), e gera `EVO_BUILTIN_COMPONENT_META`.
- **`ng g ui-component`** gera também `<nome>.preview.ts` e `README.md`, e os
  metadados já apontam para o preview.

### Alterado

- **`EvoTokenMap`** deixa de ser `Record<string, …>`: um objecto literal com
  uma chave curta que nenhum CSS da toolkit lê deixa de compilar. Usar o nome
  completo do token, ou a forma `--nome` para tokens próprios.
- **Pré-visualizações por componente.** O `@switch` único deu lugar a um
  `<nome>.preview.ts` em cada pasta de `/components`, e o `FormField` passa a
  ter pré-visualização.

### Removido

- **`EvoComponentPreview`** (`evo-component-preview`) deixa de ser exportado
  por `@evolium-kit/toolkit/pages`. Um componente de fora da toolkit fornece a
  sua pré-visualização no campo `preview` dos metadados.

## [0.1.3] - 2026-09-29

### Adicionado

- **`EvoSwitch`** (`evo-switch`), em `@evolium-kit/toolkit/components`: um
  interruptor ligado/desligado com `role="switch"` que implementa
  `ControlValueAccessor` (`formControlName`, `[formControl]`, `[(ngModel)]`).
  Funciona também sozinho, com `[(checked)]`. É personalizável por cinco
  tokens: `--evo-switch-bg`, `--evo-switch-bg-checked`,
  `--evo-switch-thumb-bg`, `--evo-switch-thumb-size` e `--evo-switch-radius`.
  O tamanho do círculo faz crescer o interruptor inteiro, na mesma proporção.
  Fica registado no Theme Studio em _Formulário → Switch_, com pré-visualização
  dos estados desligado, ligado e desactivado. Documentação completa em
  `components/src/lib/switch/README.md`.
- **Theme Studio: atalhos de teclado.** Ctrl/⌘+S guarda e Ctrl/⌘+K põe o foco
  na pesquisa.

### Alterado

- **Theme Studio: botão Guardar.** Fica indisponível quando não há alterações
  por gravar, mostra "A guardar…" e depois "Guardado", e anuncia a gravação a
  leitores de ecrã.
- **Theme Studio: organização interna.** Os componentes da interface do Studio
  (barra do topo e pré-visualização) passaram para
  `theme-studio/components/<nome>/`. A API pública não muda:
  `EvoComponentPreview` continua exportado com o mesmo nome.

### Corrigido

- **Theme Studio: erros ao guardar passavam despercebidos.** Uma falha da
  persistência (por exemplo, HTTP) ficava como promessa rejeitada sem aviso.
  Agora mostra "Não foi possível guardar." e mantém as alterações por gravar.
- **Theme Studio: Guardar sem persistência configurada** não fazia nada e não
  dizia porquê. Agora o botão fica indisponível, com uma dica a sugerir
  Exportar.

### Notas

- Quem importa `@evolium-kit/toolkit/components` precisa de `@angular/forms`
  instalado, por causa do `ControlValueAccessor` do `EvoSwitch`. Já está nas
  `peerDependencies` e uma aplicação criada com `ng new` já o traz.

## [0.1.2] - 2026-09-28

### Adicionado

- **`EvoFormField`** (`evo-form-field`), em `@evolium-kit/toolkit/components`,
  registado no Theme Studio na categoria _Formulário_. Por agora é só o
  esqueleto: projecta conteúdo e aceita `disabled`; `label`, `hint` e `error`
  ainda não existem.

### Corrigido

- **`ng g @evolium-kit/toolkit:page <nome> --resource=<x>` gerava um teste que
  falhava logo** — o spec não registava o resource e o
  `registry.get('<x>')` rebentava ao montar a página. O spec gerado passa a
  pôr o `EvoResourceRegistry` em mock. Quem já gerou páginas com `--resource`
  pode copiar o provider do template novo.
- **`ng g @evolium-kit/toolkit:ui-component` usava a categoria `Basicos`**
  (sem acento), diferente da `Básicos` dos componentes da toolkit: o Theme
  Studio mostrava duas categorias. A omissão passa a ser `Básicos`.

## [0.1.1] - 2026-09-24

### Corrigido

- **`ng add` não registava o Theme Studio** — responder "sim" à pergunta
  "Registar o Theme Studio?" não acrescentava `provideEvoThemeStudio()` a
  lado nenhum; a mensagem final da consola dava a entender (por engano) que
  já estava pronto. `/_evo/theme` dava sempre 404. Confirmado em produção por
  um consumidor real a instalar a 0.1.0.

  Corrigido com um utilitário dedicado
  (`schematics/utils/theme-studio.ts`) que insere
  `...(isDevMode() ? [provideEvoThemeStudio()] : [])` como a **primeira**
  entrada de `providers`, sempre antes do `provideRouter` — o requisito de
  ordem que evita uma rota `**` a sombrear `/_evo/theme`. Cinco testes de
  regressão novos em `ng-add.spec.ts`.

  **Quem instalou a 0.1.0** encontra o passo de correcção manual (ou o
  upgrade) em `INSTALL.md`, passo 8.

### Notas

- `provideEvoTheme()` em falta e `/` a devolver 404, ambos reportados no
  mesmo incidente, **não são bugs da toolkit** — investigados e confirmados
  como específicos do projecto em causa (edição manual de `app.config.ts` e
  remoção de `<router-outlet>` de `app.html`, respectivamente). `INSTALL.md`
  passo 9 ganhou uma nota a explicar o segundo caso, por ser fácil de
  confundir com um bug real.

## [0.1.0] - 2026-09-23

### Adicionado

- **`@evolium-kit/toolkit/core`** — modelo de tema, tokens de DI,
  `EvoTokensDirective` para override por instância e por subárvore, metadados de
  componente para o Theme Studio, e validação de tokens contra injecção de CSS.
- **`/theme`** — `EvoThemeStore` com signals, `provideEvoTheme()` com features
  composáveis, três adapters de persistência (memória, `localStorage`, HTTP),
  exportador para `evolium-theme.css` e `.json`, e paleta flat com contrastes
  WCAG AA verificados.
- **`/components`** — `EvoButton`, `EvoInput`, `EvoField`, `EvoCard`, `EvoBadge`.
  Todos temáveis por CSS custom properties.
- **`/layouts`** — `EvoAuthShell`, `EvoDashboardShell`, `EvoBlankShell`.
- **`/pages`** — `EvoLoginPage`, `EvoRegisterPage`, `EvoForgotPasswordPage`,
  `EvoNotFoundPage`, `evoAuthRoutes()` e o **Theme Studio** em `/_evo/theme`.
- **`/services`** — kernel de plugins com ordenação topológica, registo
  type-safe, interceptors por plugin e partilhados, e o plugin de autenticação
  construído sobre os mesmos contratos que qualquer plugin de terceiros.
- **Schematics** — `ng add`, e geradores `page`, `layout`, `ui-component` e
  `resource-plugin`.
- **CI/CD** — build, testes, verificação do artefacto e instalação limpa em cada
  PR; publicação no GitHub Packages por tag `v*.*.*`.

### Notas de arquitectura

- O scope é `@evolium-kit` porque a organização `evolium` já estava ocupada.
- As camadas dependem só para baixo: `pages`/`layouts` → `components` → `theme`
  → `core`, e `services` → `core`. As rotas das páginas de autenticação vivem em
  `/pages` (e não no plugin de auth) precisamente para não inverter esta direcção.
- O Theme Studio usa tokens próprios `--st-*` e não os componentes da toolkit,
  para que um tema mau não possa tornar a ferramenta inutilizável.
