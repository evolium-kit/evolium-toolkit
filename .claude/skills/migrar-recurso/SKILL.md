---
name: migrar-recurso
description: Migra um componente ou serviço vindo de outro projecto (em src/app/component-models ou src/app/service-models) para o padrão da evolium-toolkit — analisa, lista props/tokens/funcionalidades, sugere melhorias, pergunta extras ao utilizador, gera o recurso, documenta-o e regista-o em projects/toolkit/RESOURCE-MIGRATE.md. Usar quando o utilizador pedir para migrar, padronizar ou integrar um recurso-modelo na toolkit.
argument-hint: c|s <recurso-original> [recurso-toolkit]
---

# /migrar-recurso

Argumentos recebidos: `$ARGUMENTS`

Formato: `/migrar-recurso c|s <recurso-original> [recurso-toolkit]`

| Argumento            | Significado                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `c` / `s`            | `c` = componente (procura em `src/app/component-models/`), `s` = serviço/plugin (`src/app/service-models/`)             |
| `<recurso-original>` | nome da pasta ou ficheiro do modelo. Correspondência tolerante: sem extensão, sem `.service`, sem distinguir maiúsculas |
| `[recurso-toolkit]`  | **opcional.** Nome do recurso na toolkit. Se faltar, deriva-se (ver Fase 1)                                             |

Se `c|s` ou `<recurso-original>` faltarem ou forem inválidos, pára e mostra o formato acima com
os modelos disponíveis (`Glob` em `src/app/*-models/**`). Não adivinhes o tipo.

O processo tem **duas paragens obrigatórias** em que esperas pela resposta do utilizador (fim da
Fase 2 e, se houver sobreposição, na Fase 1). Nunca geres código antes da aprovação da Fase 2.

---

## Fase 0 — Ler as regras (sempre, antes de tudo)

Lê, por esta ordem, e respeita sem excepção as regras invioláveis do `.claude/CLAUDE.md`:

- Componente: `projects/toolkit/components/README.md`, `docs/theming.md`, e um componente de
  referência completo — `projects/toolkit/components/src/lib/switch/` (todos os ficheiros: é o
  exemplo de uma migração bem feita, incluindo a secção "Migração a partir de …" do README).
- Serviço: `projects/toolkit/services/README.md`, `docs/plugins.md`, e
  `projects/toolkit/services/src/lib/plugins/auth/` como referência.
- Sempre: `.claude/KNOWN-BUGS.md` e `projects/toolkit/RESOURCE-MIGRATE.md` (para saber se este
  recurso já foi migrado — se foi, pergunta se é para refazer ou estender).

## Fase 1 — Localizar e classificar

1. **Encontrar o original.** `c` → `src/app/component-models/`; `s` → `src/app/service-models/`.
   Pode ser uma pasta (lê todos os ficheiros dentro, incluindo README) ou um ficheiro solto. Se
   houver várias correspondências, lista-as e pergunta qual. Atenção a sub-recursos dentro da
   pasta (ex.: `input-field/whapper-auth-background/`): são recursos **separados**, migram-se à
   parte — menciona-os mas não os migres juntos.

2. **Confirmar a natureza real.** O parâmetro `c|s` diz onde procurar, não decide o destino final:

   | O original é…                                                   | Destino                                                                         |
   | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
   | elemento de UI reutilizável                                     | `projects/toolkit/components/src/lib/<nome>/`                                   |
   | casca de página / wrapper de ecrã inteiro (ex.: fundo de login) | **avisa**: pertence a `projects/toolkit/layouts/` — pergunta antes de continuar |
   | serviço que fala com uma API (CRUD, recurso REST)               | plugin de recurso em `services/src/lib/plugins/<nome>/`                         |
   | serviço utilitário sem HTTP (validadores, formatação, máscaras) | plugin utilitário em `services/src/lib/plugins/<nome>/` (ver Fase 4-S)          |

3. **Detectar sobreposição** com o que a toolkit já tem. Lista `components/src/lib/*/` e
   `services/src/lib/plugins/*/` e compara funcionalidade, não nome. Exemplo real:
   `form-input-field` sobrepõe-se a `EvoInput` (`input[evoInput]`) + `EvoField` (`evo-field`).
   Se houver sobreposição, **pára e pergunta** (`AskUserQuestion`) entre:
   - estender o recurso existente com o que falta (normalmente o recomendado);
   - criar um recurso novo que **compõe** os existentes (ex.: um `evo-text-field` que usa
     `evo-field` + `evoInput` por dentro);
   - criar um recurso independente (justifica porque não reutiliza).

4. **Derivar o nome**, se `[recurso-toolkit]` não foi dado:
   - Componente: kebab-case, **em inglês** (como `button`, `switch`, `form-field`), sem prefixos
     do projecto de origem (`app-`, `form-`, `wrapper-`) nem sufixos (`Component`, `-button`
     quando redundante). Ex.: `app-switch-button` → `switch`. Classe `Evo<Nome>`, selector
     `evo-<nome>`, ou `<elemento>[evo<Nome>]` se for uma directiva sobre elemento nativo.
   - Plugin de recurso HTTP: o nome do recurso como a API o chama, **no plural** (o gerador deriva
     o singular). Ex.: `FacturaService` → `facturas`.
   - Plugin utilitário: substantivo curto em inglês. Ex.: `ValidacaoService` → `validation`,
     token `EvoValidation`.
   - Nunca colidir com um nome já existente nos `public-api.ts`.

## Fase 2 — Relatório de análise (PARAGEM OBRIGATÓRIA)

Apresenta ao utilizador, nesta ordem e em português:

### 2.1 Resumo

Duas a quatro frases: o que o recurso faz, onde era usado, e o destino proposto (caminho + nome

- selector/token). Se houve sobreposição, a decisão tomada na Fase 1.

### 2.2 Inventário (o que o original disponibiliza)

**Componente** — tabelas:

- **Props**: nome original | tipo | omissão | `@Input`/`input()`/`model()` | descrição | → nome na toolkit
- **Eventos**: nome original | payload | → nome na toolkit (`model()` quando é two-way)
- **Slots** (`ng-content` e seletores)
- **Estilos/visual hard-coded** (cores, raios, espaçamentos, classes Tailwind, animações): cada
  valor literal → token proposto `--evo-<nome>-<parte>` e de que token semântico herda
  (`--evo-color-*`, `--evo-radius-*`, `--evo-space-*` — confirma os nomes reais em `docs/theming.md`)
- **Comportamento**: CVA, validação, acessibilidade, teclado, estados (disabled, loading, erro…)

**Serviço** — tabelas:

- **Métodos públicos**: assinatura | o que faz | → nome na API do plugin
- **Estado**: campos/observables → `signal`/`computed` só leitura
- **Configuração** implícita (URLs, mensagens, constantes) → opções do `withPlugin(x(), { … })`
- **Dependências** (`HttpClient`, `localStorage`, outros serviços) → equivalente no `ctx`

### 2.3 Problemas encontrados no original

Bugs, código morto, props declaradas e não usadas, violações das regras invioláveis
(`@Input`, `NgModule`, `ngClass`, `window`/`crypto` fora do browser, `console.log`, `any`,
`localStorage` directo, mensagens com erros ortográficos, lógica duplicada…). Seja específico,
com `ficheiro:linha`.

### 2.4 Sugestões

Separadas em três listas curtas e numeradas, para o utilizador poder escolher por número:

- **Atributos novos** (props/inputs/tokens/opções de configuração que fazem sentido acrescentar);
- **Funcionalidades novas**;
- **Melhorias** (a11y, SSR, desempenho, API mais simples, testes).

Indica para cada uma se a recomendas (★) e porquê numa linha. Não proponhas o que viola as regras.

### 2.5 Perguntas

Usa `AskUserQuestion` (multiSelect) para:

1. quais sugestões de 2.4 incluir (as ★ como recomendadas);
2. se quer acrescentar **atributos/funcionalidades adicionais** próprias — é opcional; o
   utilizador pode responder "nenhum";
3. confirmar nome/destino, se ainda houver dúvida.

### 2.6 Inquérito de tokens (só componentes)

Depois das respostas de 2.5 (que podem acrescentar partes visuais, ex.: um botão interno), faz
um segundo `AskUserQuestion` só sobre **que variáveis CSS devem ser personalizáveis**:

- começa por dizer que tokens **já existentes** o componente reaproveita (de `--evo-<outro>-*`
  ou semânticos) e que portanto não precisam de token próprio;
- agrupa os candidatos `--evo-<nome>-*` por zona (estados, textos, ícones/acções, caixa), até 4
  por pergunta, cada um com o token de que herda na descrição e ★ nos recomendados;
- inclui sempre uma pergunta "herdar vs. tokens próprios" quando o componente compõe outro;
- aceita tokens extra escritos pelo utilizador em "Other" e confirma a interpretação (nome +
  de que herda) antes de gerar.

O resultado define a lista exacta do `.tokens.ts` e do CSS (1:1).

**Pára aqui e espera.** Não geres nada até teres resposta.

## Fase 3 — Plano curto

Depois da resposta, mostra em 5–10 linhas a lista de ficheiros a criar/alterar e a API final
(props/eventos/tokens ou métodos/opções). Avança sem nova paragem, a não ser que a resposta do
utilizador tenha trazido ambiguidade real.

## Fase 4-C — Gerar um componente

1. `npm run new:component -- <nome> --category=<Básicos|Formulário|Superfícies> [--variants=a,b] --dry-run`,
   confirma a saída, e corre sem `--dry-run`. Nunca uses `ng g` aqui (ver README de components).
2. Reescreve os ficheiros gerados com a funcionalidade migrada, seguindo **à letra** o "Contrato
   do componente" do README de components:
   - standalone, `OnPush`, `input()`/`output()`/`model()`, signals, `linkedSignal` em vez de
     `effect` de sincronização, estados como `data-evo-*` no host, unions com `(string & {})`;
   - CSS só com `var(--evo-*)`, dentro de `@layer evo.components`, **nunca declarando o próprio
     token** (Regra 1) e nunca `@property` em tokens de componente (Regra 2);
   - conteúdo projectado estilizado na folha global, não no `styleUrl` (ver "Onde o CSS tem de viver");
   - `ControlValueAccessor` completo quando é um controlo de formulário, com `setDisabledState`
     **implementado**;
   - IDs únicos sem `crypto`/`window` (não são SSR-safe e quebram a hidratação): usar um
     contador de módulo (`let proximoId = 0;` → `evo-<nome>-${proximoId++}`);
   - primitivas complexas pelo `@angular/cdk` (overlay, focus trap, listbox…), nunca à mão.
3. `<nome>.tokens.ts`: um token por cada valor visual parametrizável — os tokens do `.tokens.ts`
   e do CSS têm de bater 1:1. Todos os tokens com o prefixo do componente
   (`--evo-<nome>-<parte>`), nunca nomes genéricos (`--evo-ring-width`): o autocomplete e a
   verificação de `[evoTokens]` (`EvoTokenNames`) são gerados do CSS por
   `npm run gen:registry`, sem registo manual. Depois de escrever o CSS, corre-o e confirma que
   os tokens novos aparecem em `core/src/lib/generated/token-names.ts`.
4. `<nome>.preview.ts`: todos os estados lado a lado (`pv__row`/`pv__stack`/`pv__estado`).
5. `evo-<nome>.spec.ts`: render por omissão, cada input reflectido, cada output, ARIA em cada
   estado (e que sai ao sair do estado), teclado, e a verificação textual da Regra 1 (ver
   `button/evo-button.spec.ts`).
6. Acrescenta o componente à tabela e aos exemplos da secção "Usar" de
   `projects/toolkit/components/README.md`.
7. Exercita-o no playground (`src/app/playground/`) — uma secção com os estados e um exemplo com
   Reactive Forms se for controlo de formulário.

## Fase 4-S — Gerar um serviço/plugin

1. **Plugin de recurso HTTP**: `npm run new:plugin -- <nome> [--depends-on=auth] [--endpoints=…] --dry-run`,
   confirma, corre. Segue a checklist do README de services: modelos e DTOs separados, mappers,
   endpoints declarativos (`anonymous: true` onde não leva token), `declare module` no
   `EvoResourceMap` (relativo: `../../kernel/resource-map`), estado em signals só leitura, erros
   por `ctx.toError(e)`, `ctx.storage`/`ctx.isServer` em vez de `localStorage`.
2. **Plugin utilitário (sem HTTP)**: cria a pasta à mão em `services/src/lib/plugins/<nome>/`,
   copiando a forma do `auth` mas sem endpoints:
   - `<nome>.<parte>.ts` com **funções puras exportadas** (ex.: `evoEmailValidator`,
     `evoNifValidator`) — usáveis sem DI e tree-shakable;
   - `<nome>.plugin.ts` com `<nome>Plugin()` cujo `setup()` devolve a API que precisa de
     configuração (ex.: mensagens de erro sobreponíveis por `withPlugin(validationPlugin(), { messages })`),
     o `InjectionToken` `Evo<Nome>` e o `declare module` no `EvoResourceMap`;
   - uma interface de extensão vazia `Evo<Nome>Extensions` intersectada no `EvoResourceMap`, para
     outros plugins poderem acrescentar (ex.: validadores de outro país);
   - exporta tudo no bloco "Plugins built-in" de `services/src/public-api.ts`.
3. **Nunca tocar em `services/src/lib/kernel/`.** Se parecer necessário, pára e explica ao
   utilizador qual o ponto de extensão genérico que falta (regra inviolável 2).
4. `<nome>.plugin.spec.ts`: caminho feliz de cada método + pelo menos um erro. Para HTTP, com
   `HttpTestingController`.
5. Acrescenta o plugin à secção "Usar" de `projects/toolkit/services/README.md`.
6. Exercita-o no playground (`src/app/playground/`).

## Fase 5 — Documentação do recurso

Cria `README.md` **na pasta do recurso criado**, no formato de
`components/src/lib/switch/README.md` (o Studio mostra-o para componentes). Secções:

1. Título `# Evo<Nome> — \`<selector>\``(ou`# <nome>Plugin — \`Evo<Nome>\``) e resumo; diagrama
   ASCII dos estados, se for visual.
2. **Importar** (e, para plugins, a linha `withPlugin(...)` no `app.config.ts`).
3. **API** — tabela completa: nome | tipo | omissão | `input()`/`model()`/método | descrição.
   Atributos `data-evo-*` reflectidos no host.
4. **Exemplos** copiáveis: uso mínimo, cada funcionalidade relevante, Reactive Forms / `ngModel`
   quando aplicável, consumo pelo token e pelo `EvoResourceRegistry` para plugins.
5. **Personalizar** (componentes): tabela de tokens (token | controla | herda de), exemplos em
   `:root`, `[evoTokens]` por instância e por subárvore (sempre com o nome curto completo,
   ex.: `'text-field-ring-width'`), e como aparece no Theme Studio.
   **Configuração** (plugins): opções do `withPlugin` com omissões.
6. **Acessibilidade** (componentes) / **SSR e erros** (plugins).
7. **Migração a partir de `<original>`** — tabela Antes | Agora com cada prop/método/evento/
   estilo renomeado ou alterado, e como reproduzir o visual antigo com tokens.
8. **Ficheiros** — árvore da pasta.

## Fase 6 — Verificar

Corre, e corrige até passar (mostra o resultado real; não declares sucesso sem ele):

```bash
npm run build:lib
npm run test:lib
npm run test:schematics
node tools/verify-dist.mjs
npx prettier --write <pasta do recurso>
```

Se mexeste em `public-api.ts`/`exports`/providers, corre também `node tools/verify-install.mjs`.
Depois arranca o playground e confirma o recurso a funcionar no browser (skill `run`), não só
nos testes.

## Fase 7 — Registar

Acrescenta uma linha à tabela "Migrados" de `projects/toolkit/RESOURCE-MIGRATE.md` (data de hoje
em `AAAA-MM-DD`, tipo, original, nome na toolkit, caminho, estado, notas com as decisões
relevantes — sobreposição resolvida, sugestões aceites) e remove-o da lista "Por migrar", se lá
estiver. Se a migração ficou incompleta (testes a falhar, decisão pendente), o estado é
`parcial` e as notas dizem o que falta.

Termina com um resumo curto ao utilizador: o que foi criado, onde, o que ficou de fora e porquê.
