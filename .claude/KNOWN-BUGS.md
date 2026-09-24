# Bugs conhecidos

Problemas já identificados, ainda por corrigir. Encontraste um destes de
novo? Não investigues do zero — confirma primeiro que não está aqui descrito
com a causa já apurada.

Bugs que já foram corrigidos **não** ficam aqui — vivem em
`.claude/PROJECT_OVERVIEW.md`, secção "Bugs já resolvidos", como contexto
histórico.

Convenção de estado: 🔴 por resolver · 🟡 contornado (workaround documentado,
correcção definitiva em falta) · 🟢 correcção pronta, a aguardar validação.

---

## 🟡 `ng add` falha com "does not provide any `ng add` actions" — limitação do GitHub Packages, não da toolkit

**Confirmado em produção** em 2026-09-24, reportado por um consumidor real a
instalar `@evolium-kit/toolkit@0.1.0`.

**Causa apurada e verificada:** o `ng add` consulta os metadados do pacote no
registry (passo "Loading package information") _antes_ de instalar, para
decidir se avança. O GitHub Packages devolve aqui uma versão **abreviada**
desses metadados (confirmado com `npm view @evolium-kit/toolkit
--registry=https://npm.pkg.github.com`), sem campos personalizados como
`schematics`. O Angular CLI conclui, por isso, que o pacote não tem `ng add`
para oferecer — mesmo o pacote instalado a seguir estar perfeitamente
correcto.

**Prova de que o pacote em si está correcto:** o tarball publicado foi
descarregado e inspeccionado directamente (`npm pack` + extracção); o
`package.json` lá dentro tem `"schematics": "./schematics/collection.json"`
correcto, e todos os ficheiros do schematic estão presentes. Depois de um
`ng add` "falhado", o `package.json` instalado em `node_modules` também tem
o campo correcto.

**Contorno verificado, reproduzido de ponta a ponta:**

```bash
ng add @evolium-kit/toolkit        # instala o pacote; o aviso não impede isto
ng generate @evolium-kit/toolkit:ng-add   # corre o schematic, lê do disco
```

O `ng generate` funciona sempre, porque lê o `package.json` já instalado em
disco, e não os metadados abreviados do registry. Testado com todas as
opções (`--base-url`, `--auth`, `--auth-routes`, `--theme-studio`,
`--skip-install`) — altera `package.json`, `app.config.ts`, `styles.css` e
`app.routes.ts` correctamente.

**Documentado em:** `INSTALL.md`, passo 5.

**Correcção definitiva pendente:** não há nada a corrigir do lado da
toolkit — isto é uma limitação de como o GitHub Packages implementa a API
de registry npm. As opções, nenhuma perfeita:

- manter o contorno documentado (actual);
- investigar se existe algum campo do `package.json` que o GitHub Packages
  preserve nos metadados abreviados e que possa servir de sinal alternativo
  (não confirmado que exista);
- migrar a publicação para um registry com metadados completos (Verdaccio
  próprio, Artifactory, ou o npm público) — mudança maior, fora de âmbito
  sem decisão de negócio.

---

## 🟡 `ng add` não injecta `withComponentInputBinding()`

**Onde:** `projects/toolkit/schematics/ng-add/index.ts`

O `provideRouter()` do projecto consumidor precisa da feature
`withComponentInputBinding()` para as páginas de autenticação (`EvoLoginPage`,
etc.) receberem as suas opções pelo `data` da rota. O schematic não a injecta.

**Sintoma sem a correcção:** as páginas abrem normalmente, mas ignoram
silenciosamente inputs como `redirectTo` — sem erro nem aviso.

**Contorno actual:** documentado como passo manual no `INSTALL.md` (passo 7),
e o `ng-add/index.ts` já avisa na consola no fim da instalação.

**Correcção pendente:** o `addRootProvider` teria de detectar se
`provideRouter(routes)` já existe sem `withComponentInputBinding()` e
reescrever a chamada para a acrescentar — mais delicado do que os outros
`addRootProvider` do schematic, que só acrescentam um provider novo à lista;
este precisa de **modificar os argumentos de uma chamada existente**.

---

## 🔴 `assertRouteReachable()` nunca foi exercitado contra um wildcard real

**Onde:** `projects/toolkit/pages/src/lib/theme-studio/provide-evo-theme-studio.ts`

A lógica que detecta uma rota `**` a sombrear `/_evo/theme` foi escrita e
lida, mas **nunca testada** contra um projecto com um wildcard de verdade — o
playground (`src/app/app.routes.ts`) não tem nenhuma rota `**` antes da rota
do Studio para a provocar.

**Risco:** se a lógica de comparação de índices estiver errada, só se
descobre num projecto consumidor real, não no desenvolvimento da toolkit.

**Para corrigir:** acrescentar um teste (unitário ou no playground) que
registe deliberadamente `{ path: '**' }` antes do Theme Studio e confirme que
o aviso aparece.

---

## 🔴 Comportamento responsivo do `EvoDashboardShell` nunca verificado visualmente

**Onde:** `projects/toolkit/layouts/src/lib/dashboard-shell/dashboard-shell.css`

O CSS para ecrã estreito (`@media (width < 1024px)`, sidebar em overlay) foi
escrito seguindo o padrão documentado, mas todas as verificações no browser
durante o desenvolvimento usaram viewport de desktop (screenshots a
1568×687). Nunca foi confirmado visualmente que o overlay, o `box-shadow` de
fundo e o comportamento de toque funcionam como esperado em mobile.

**Para corrigir:** abrir o playground com viewport reduzido (ou nas
ferramentas de DevTools em modo responsivo) e confirmar visualmente.

---

## 🔴 Inconsistência de nomes entre workspace, projecto Angular e repositório

**Onde:** `package.json` (raiz), `angular.json`

Três nomes diferentes coexistem sem problema técnico, mas são confusos para
quem chega de novo:

- `package.json` raiz: `"name": "toolkit"`
- Projecto Angular em `angular.json`: `evolium-app-overview`
- Repositório no GitHub: `evolium-toolkit`
- Pacote publicado: `@evolium-kit/toolkit`

Nenhum destes precisa de coincidir para o build funcionar, mas a
inconsistência já gerou confusão durante o desenvolvimento (ex.: o script
`serve:ssr:evolium-app-overview` ficou com um nome desalinhado depois de o
`package.json` raiz ter sido renomeado para `toolkit`).

**Para corrigir:** decisão de baixa prioridade — escolher um nome e
alinhar os três, ou aceitar formalmente a distinção (workspace ≠ projecto
Angular ≠ repositório) e documentá-la em vez de a corrigir.
