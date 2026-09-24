# Evolium Toolkit — roteador

Este ficheiro não explica o projecto — só diz **onde está a explicação** e
quais regras nunca se negoceiam. Se estás a decidir como fazer algo, a
resposta quase de certeza já está escrita num dos documentos abaixo; não
adivinhes, lê primeiro.

## Regras invioláveis

Violar qualquer uma destas parte alguma coisa **sem erro visível** — é por
isso que são invioláveis e não apenas preferências de estilo.

1. **Dependências entre entry points só apontam para baixo:**
   `pages`/`layouts` → `components` → `theme` → `core`, e `services` → `core`.
   Nunca ao contrário — o ng-packagr recusa ciclos, e já aconteceu uma vez
   (ver `docs/architecture.md`).
2. **O kernel de serviços (`services/src/lib/kernel/`) não pode ganhar casos
   especiais.** Se sentires vontade de lá mencionar o nome de um plugin
   concreto, pára — o problema resolve-se do lado do plugin ou falta um
   ponto de extensão genérico (decisão a discutir, não a implementar).
3. **Um componente nunca declara o valor do seu próprio token de camada 3** —
   só o refere no fallback do `var()`. Ver `docs/theming.md`.
4. **`sharedInterceptors`, não `interceptors`, para qualquer coisa que deva
   afectar pedidos de outros plugins** (nomeadamente autenticação). Já houve
   um bug real por causa disto — ver `docs/plugins.md`.
5. **Zoneless, 100% standalone, signals primeiro, `OnPush` sempre,
   `input()`/`output()`/`model()`** — nunca `NgModule`, `zone.js`,
   `@Input`/`@Output` decoradores.
6. **SSR-safe sempre.** Nada de `window`/`document`/`localStorage` fora de
   `isPlatformBrowser()` ou `afterNextRender()`. Nunca ramificar um template
   por esquema de tema (`@if scheme() === 'dark'`) — dá `NG0500`.
7. **A publicação é só pelo GitHub Actions.** Nunca `npm publish` de uma
   máquina local.

## Onde ler, por tarefa

| Vais...                                                               | Lê primeiro                             |
| --------------------------------------------------------------------- | --------------------------------------- |
| Perceber o estado geral do projecto, antes de mexer em qualquer coisa | `.claude/PROJECT_OVERVIEW.md`           |
| Saber o que já está feito e o que vem a seguir                        | `.claude/ROADMAP.md`                    |
| Ver se um problema que encontraste já é conhecido                     | `.claude/KNOWN-BUGS.md`                 |
| Decidir se precisas de perguntar ao humano antes de continuar         | `.claude/MISSING-INFO.md`               |
| Instalar a toolkit num projecto consumidor                            | `INSTALL.md`                            |
| Perceber a arquitectura em profundidade (porquê, não só o quê)        | `docs/architecture.md`                  |
| Mexer em tokens, cascata, Theme Studio                                | `docs/theming.md`                       |
| Criar ou estender um plugin de serviço                                | `docs/plugins.md`                       |
| Preparar o ambiente, testar, publicar                                 | `docs/contributing.md`                  |
| Acrescentar um componente                                             | `projects/toolkit/components/README.md` |
| Acrescentar um layout/shell                                           | `projects/toolkit/layouts/README.md`    |
| Acrescentar uma página                                                | `projects/toolkit/pages/README.md`      |
| Mexer em `/core`                                                      | `projects/toolkit/core/README.md`       |
| Mexer em `/theme`                                                     | `projects/toolkit/theme/README.md`      |
| Mexer em `/services`                                                  | `projects/toolkit/services/README.md`   |

## Antes de dar por terminada qualquer alteração

```bash
npm run build:lib
npm run test:lib
npm run test:schematics
node tools/verify-dist.mjs
```

Se mexeste em providers, `exports`, no `ng add`, ou em qualquer coisa de
`tools/`, corre também `node tools/verify-install.mjs` — é lento, mas é o
único teste que já apanhou bugs que nenhum outro apanhou (ver
`.claude/PROJECT_OVERVIEW.md`, secção "Bugs já resolvidos").

Uma alteração só está terminada depois de exercitada no playground (`src/`),
não só nos testes unitários.
