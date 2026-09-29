# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

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
