# Roadmap

O que está feito, o que falta, e a ordem sugerida. Actualizar sempre que uma
fase muda de estado — este ficheiro serve para não repetir trabalho já feito
nem esquecer o que falta.

## Feito

| #   | Fase                  | Entregue                                                                                   |
| --- | --------------------- | ------------------------------------------------------------------------------------------ |
| 0   | Fundação do workspace | 6 entry points, `ng build toolkit` compila todos                                           |
| 1   | `/core` + `/theme`    | `EvoThemeStore`, cascata de 4 níveis, persistência (memória/localStorage/HTTP), exportador |
| 2   | `/components`         | `EvoButton`, `EvoInput`+`EvoField`, `EvoCard`, `EvoBadge`                                  |
| 3   | Theme Studio          | 3 painéis, pesquisa, escopo Global/Variante, imune ao próprio tema                         |
| 4   | `/services`           | kernel de plugins, `authPlugin()`, guards, `sharedInterceptors`                            |
| 5   | `/layouts` + `/pages` | `EvoAuthShell`/`EvoDashboardShell`/`EvoBlankShell`, páginas de auth, `evoAuthRoutes()`     |
| 6   | Schematics            | `ng add` + geradores `page`/`layout`/`ui-component`/`resource-plugin`                      |
| 7   | CI/CD                 | `ci.yml`, `release.yml`, `verify-dist.mjs`, `verify-install.mjs`                           |
| 9   | Documentação          | READMEs por módulo, `docs/`, `INSTALL.md`, este `.claude/`                                 |

Testes: 62 na library (7 ficheiros) + 28 nos schematics (2 ficheiros) = **90**.

**Publicado:** `0.1.0` em 2026-09-23, `0.1.1` em 2026-09-24 (correcção do
`ng add`/Theme Studio — ver `.claude/PROJECT_OVERVIEW.md`, bug #10, e
`CHANGELOG.md`).

## Em falta

### Fase 8 — Agentes Claude Code + MCP do GitHub

Planeada, nunca implementada (foi propositadamente adiada a pedido do
utilizador para priorizar a documentação). Envolveria:

- `.claude/agents/*.md` especializados: `evo-component-builder`,
  `evo-resource-plugin`, `evo-page-builder`, `evo-release`
- `.claude/skills/evo-plugin-kernel/` com a referência do kernel
- `.mcp.json` a apontar para o servidor MCP do GitHub
  (`github/github-mcp-server`, variante remota
  `https://api.githubcopilot.com/mcp/`)

### Lacunas conhecidas no `ng add`

Dois passos que hoje são manuais e deveriam ser automáticos:

- `withComponentInputBinding()` não é injectado no `provideRouter`
- A rota `provideEvoThemeStudio()` não é registada automaticamente

Ambos estão documentados como passos manuais no `INSTALL.md` (passos 7 e 8) e
avisados na consola do `ng add`. Ver `.claude/KNOWN-BUGS.md`.

### Componentes ainda não construídos

A base de UI foi desenhada para usar `@angular/cdk` (Overlay, A11y, Portal,
Dialog) além dos componentes próprios, mas só os quatro mais simples existem.
Em falta, por ordem provável de necessidade:

- `EvoSelect`, `EvoCheckbox`, `EvoRadio` — para formulários completos
- `EvoDialog` (sobre `CdkDialog`) — o `components/README.md` já documenta o
  padrão a seguir para usar o CDK aqui
- `EvoMenu` (sobre `CdkMenu`), `EvoTable` (sobre `CdkTable`)
- `EvoTabs`, `EvoTooltip`

Cada um usa `ng g @evolium-kit/toolkit:ui-component <nome>` como ponto de
partida — ver `projects/toolkit/components/README.md`.

### Ligação a um backend real

Todo o desenvolvimento até agora corre contra `demo-api.interceptor.ts`, um
mock em `src/app/`. Não existe nenhuma API real a implementar
`/auth/login`, `/auth/refresh`, etc. — ver `.claude/MISSING-INFO.md`.

## Não planeado (fora de âmbito, a menos que alguém peça)

- Suporte a i18n dentro dos componentes da toolkit (as páginas já aceitam
  `copy` por input, o que cobre a maior parte dos casos)
- Testes E2E (Playwright/Cypress) — o `verify-install.mjs` cobre o caminho
  mais crítico (instalação real), mas não interacção de UI ponta a ponta
- Versão React/Vue da toolkit — é explicitamente só para Angular

## Ordem sugerida para o próximo trabalho

1. ~~Publicar a v0.1.0~~ — feito; ~~corrigir o registo do Theme Studio no
   `ng add`~~ — feito em 0.1.1
2. Corrigir o passo manual restante do `ng add`: `withComponentInputBinding()`
   ainda não é injectado sozinho (ver `.claude/KNOWN-BUGS.md`)
3. `EvoDialog`, por ser o componente em falta mais pedido tipicamente
4. Decidir se a Fase 8 (agentes + MCP) avança, com o utilizador
