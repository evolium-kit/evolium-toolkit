# Índice de componentes

Todos os componentes de `@evolium-kit/toolkit/components`, com uma linha sobre
cada um. Antes de criar um componente de UI, confirmar aqui se já existe.

Os caminhos dos READMEs são relativos à raiz da toolkit (no repositório,
`projects/toolkit/`; num projecto consumidor, `node_modules/@evolium-kit/toolkit/`).
Para inputs, tokens e exemplos de cada um, ler o README indicado.

## Formulários

| Componente     | Selector                                                    | Para quê                                                                                                   | README                                         |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `EvoTextField` | `evo-text-field`                                            | Campo de texto completo numa só tag: etiqueta, controlo, ícones, ajuda, erro e contador.                  | `components/src/lib/text-field/README.md`      |
| `EvoSelect`    | `evo-select`                                                | Lista de escolha (simples ou múltipla) com pesquisa, ícones, grupos e template por opção.                  | `components/src/lib/select/README.md`          |
| `EvoSwitch`    | `evo-switch`                                                | Interruptor ligado/desligado; usa-se sozinho (`[(checked)]`) ou em formulários (`ControlValueAccessor`).   | `components/src/lib/switch/README.md`          |
| `EvoInput`     | `input[evoInput]`, `textarea[evoInput]`, `select[evoInput]` | Directiva que dá o aspecto da toolkit a um controlo nativo, sem o embrulhar (mantém `ngModel` e validação). | `components/src/lib/input/`                    |
| `EvoField`     | `evo-field`                                                 | Contentor que agrupa etiqueta, controlo e mensagem de ajuda ou erro; par do `evoInput`.                    | `components/src/lib/input/`                    |

## Acções e navegação

| Componente      | Selector                                                      | Para quê                                                                                              | README                                       |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `EvoButton`     | `button[evoButton]`, `a[evoButton]`                           | Botão aplicado a um `<button>` ou `<a>` nativo; variantes solid, ghost, outline e danger.             | `components/src/lib/button/`                 |
| `EvoMenu`       | `evo-menu` + `[evoMenuTriggerFor]`                            | Menu em overlay sobre o `CdkMenu`: itens, checkboxes, radios, grupos, submenus, menu de contexto e barra de menus (`evo-menu-bar`). | `components/src/lib/menu/README.md` |
| `EvoTabs`       | `evo-tabs`, `evo-tab-list`, `button[evoTab]`, `evo-tab-panel` | Separadores com navegação por teclado (setas, Home/End) e `[(value)]`.                                 | `components/src/lib/tabs/README.md`          |
| `EvoPagination` | `evo-pagination`                                              | Paginação compacta: anterior/seguinte, páginas com reticências, resumo e linhas por página.            | `components/src/lib/pagination/README.md`    |

## Superfícies e sobreposições

| Componente  | Selector                          | Para quê                                                                                                | README                                   |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `EvoCard`   | `evo-card`                        | Superfície de conteúdo; variantes plain, sunken e outlined.                                             | `components/src/lib/card/`               |
| `EvoModal`  | `evo-modal` + `EvoModalService`   | Modal declarativo (`[(open)]`) ou por serviço (alert, confirm, prompt), sobre o `Dialog` do CDK.       | `components/src/lib/modal/README.md`     |
| `EvoDrawer` | `evo-drawer` + `EvoDrawerService` | Painel que entra de um dos lados do ecrã (esquerda, direita, topo, base), sobre o `Dialog` do CDK.     | `components/src/lib/drawer/README.md`    |

## Dados

| Componente     | Selector                                                      | Para quê                                                                                                        | README                                      |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `EvoDataTable` | `evo-data-table`                                              | Tabela com pesquisa, ordenação, paginação, selecção e linhas expansíveis, com dados em memória ou vindos de uma API. | `components/src/lib/data-table/README.md` |
| `EvoBadge`     | `evo-badge`                                                   | Etiqueta de estado; variantes neutral, primary, success, warning e danger.                                      | `components/src/lib/badge/`                 |

## Obsoleto

| Componente      | Selector          | Nota                                                                                       |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `EvoFormField`  | `evo-form-field`  | `@deprecated`. Usar `EvoField` + `evoInput`, ou `EvoTextField`.                            |

## Manter

- **Componente novo:** acrescentar uma linha aqui (na categoria certa), no
  "Índice dos componentes" de `projects/toolkit/components/README.md` e no
  README da pasta.
- O descritivo detalhado de cada input vem gerado no `AGENTS.md` do pacote;
  este ficheiro é só o mapa rápido.
