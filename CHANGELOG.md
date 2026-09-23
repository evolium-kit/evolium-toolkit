# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

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
