# Documentação da Evolium Toolkit

A **`@evolium-kit/toolkit`** é a biblioteca de UI e de serviços partilhada por
todos os projectos Angular da Evolium: componentes temáveis por CSS custom
properties, layouts prontos, páginas de autenticação completas, e um kernel de
serviços 100% baseado em plugins — tudo isto para que um projecto novo deixe
de recomeçar do zero o login, o shell da aplicação e a comunicação com a API.

Este índice é o ponto de entrada da documentação. Se és novo na equipa, lê as
páginas pela ordem em que aparecem abaixo.

---

## Por onde começar

| Se precisas de...                                                    | Lê                                         |
| -------------------------------------------------------------------- | ------------------------------------------ |
| Instalar a toolkit num projecto, do zero                             | [`../INSTALL.md`](../INSTALL.md)           |
| Perceber o que a toolkit oferece e como se usa no dia a dia          | [`getting-started.md`](getting-started.md) |
| Perceber **porquê** está organizada assim, antes de a alterar        | [`architecture.md`](architecture.md)       |
| Personalizar cores, espaçamento e o resto do tema                    | [`theming.md`](theming.md)                 |
| Criar um recurso novo (facturas, clientes...) que fale com a tua API | [`plugins.md`](plugins.md)                 |
| Contribuir código para a toolkit — componentes, páginas, plugins     | [`contributing.md`](contributing.md)       |
| Desenvolver a toolkit em si (não só consumi-la)                      | [`../README.md`](../README.md)             |

## Referência por módulo

Cada entry point publicado tem o seu próprio README, com uma metade **Usar**
(exemplos copiáveis) e outra **Estender** (os requisitos exactos para
acrescentar algo novo):

| Entry point                       | Conteúdo                                             | README                                                 |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `@evolium-kit/toolkit/core`       | tipos, tokens de DI, `EvoTokensDirective`            | [core](../projects/toolkit/core/README.md)             |
| `@evolium-kit/toolkit/theme`      | design tokens, `EvoThemeStore`, Theme Studio         | [theme](../projects/toolkit/theme/README.md)           |
| `@evolium-kit/toolkit/components` | `EvoButton`, `EvoCard`, `EvoInput`...                | [components](../projects/toolkit/components/README.md) |
| `@evolium-kit/toolkit/layouts`    | `EvoAuthShell`, `EvoDashboardShell`, `EvoBlankShell` | [layouts](../projects/toolkit/layouts/README.md)       |
| `@evolium-kit/toolkit/pages`      | páginas de autenticação, Theme Studio                | [pages](../projects/toolkit/pages/README.md)           |
| `@evolium-kit/toolkit/services`   | kernel de plugins, autenticação                      | [services](../projects/toolkit/services/README.md)     |

Estes cinco guias em `docs/` explicam os **conceitos que atravessam** vários
módulos — porque a cascata de temas funciona assim, porque os plugins não têm
casos especiais. Os READMEs de cada módulo são a referência **do dia a dia**:
a API exacta, os exemplos que copias e colas.

## Mapa mental em quatro frases

- **Um componente pode ser re-estilizado a quatro níveis** — instância,
  variante, subárvore, ou globalmente — e nenhum deles precisa de
  `::ng-deep`. Ver [`theming.md`](theming.md).
- **As camadas só dependem para baixo**: `pages`/`layouts` → `components` →
  `theme` → `core`, e `services` → `core`. Nunca ao contrário. Ver
  [`architecture.md`](architecture.md).
- **O kernel de serviços não conhece nenhum plugin em concreto** — nem sequer
  o de autenticação. Um recurso novo é sempre um plugin, nunca um caso
  especial do kernel. Ver [`plugins.md`](plugins.md).
- **O Theme Studio é imune ao tema que edita.** Usa os seus próprios tokens,
  para que um tema mal configurado nunca torne a ferramenta inutilizável. Ver
  [`theming.md`](theming.md).

## Glossário rápido

| Termo                   | Significado                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Entry point**         | um dos seis subpaths importáveis (`/core`, `/theme`, `/components`, `/layouts`, `/pages`, `/services`) |
| **Token** (de tema)     | uma CSS custom property, em três camadas: primitivo → semântico → de componente                        |
| **Plugin** (de serviço) | uma unidade do kernel que expõe um recurso (`auth`, `facturas`...) através de `provideEvoServices()`   |
| **Resource**            | a API pública que um plugin devolve, acessível por `inject(EvoAuth)` ou pelo `EvoResourceRegistry`     |
| **Shell**               | um layout que define a moldura da aplicação (`EvoAuthShell`, `EvoDashboardShell`)                      |
| **Theme Studio**        | a ferramenta visual em `/_evo/theme`, só em desenvolvimento                                            |
