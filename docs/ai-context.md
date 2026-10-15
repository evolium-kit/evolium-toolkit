# A toolkit vista pelos agentes de IA

Como o Claude Code (e outras ferramentas de IA) de um **projecto consumidor**
fica a conhecer tudo o que a toolkit instalada oferece — componentes, inputs,
tokens, layouts, páginas, serviços, geradores — para implementar e configurar
sem reinventar o que já existe, nem partir o tema ou o SSR.

## O problema

Num projecto consumidor, a toolkit vive em `node_modules/@evolium-kit/toolkit/`
e já traz os READMEs e os `.d.ts` de tudo. Mas um agente não sabe que estão
lá: o `node_modules` está no `.gitignore`, e as ferramentas de pesquisa
(Grep/Glob, ripgrep) ignoram-no. Pedir "usa o select da toolkit" dava um
agente que não encontrava nada e escrevia um select de raiz.

## A solução, em duas partes

```
 toolkit (este repositório)                 projecto consumidor
 ───────────────────────────                ─────────────────────────────────────────
 npm run build:lib                          npm install @evolium-kit/toolkit
   └─ tools/generate-agents-md.mjs   ──▶     node_modules/@evolium-kit/toolkit/
        dist/toolkit/AGENTS.md                 ├─ AGENTS.md        ◀── índice (versão instalada)
        dist/toolkit/docs/*.md                 ├─ docs/, CHANGELOG.md
        dist/toolkit/CHANGELOG.md              └─ */README.md, types/*.d.ts

                                            ng add  (ou ng g @evolium-kit/toolkit:ai-context)
                                              ├─ .claude/skills/evolium-toolkit/SKILL.md ─┐
                                              └─ CLAUDE.md (bloco entre marcadores) ──────┴─▶ "lê o AGENTS.md"
```

### 1. `AGENTS.md` dentro do pacote

Gerado no fim de cada `npm run build:lib` (script `gen:agents`), para
`dist/toolkit/AGENTS.md`, e publicado com o pacote. Tem:

| Secção                         | De onde vem                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Como ler o guia, regras de uso | escrito à mão em `projects/toolkit/AGENTS.base.md`                                                                                |
| Entry points                   | lista fixa no gerador                                                                                                             |
| Componentes                    | código-fonte: selector, `input()`/`model()`/`output()` com tipo, omissão e JSDoc; tokens do `<nome>.tokens.ts`; caminho do README |
| Layouts e páginas              | código-fonte, como os componentes                                                                                                 |
| Tokens de tema                 | `styles/evolium-theme.css` (semânticos) e `token-names.ts` gerado (todos)                                                         |
| Geradores                      | `schematics/collection.json`                                                                                                      |
| Referência da API              | os `.d.ts` agregados (o que é público) + a 1.ª frase do JSDoc                                                                     |

O que é **público** decide-se pelos `dist/toolkit/types/*.d.ts` — o que o
consumidor consegue mesmo importar. Uma classe interna (como `EvoSelectItem`)
não aparece.

O gerador também copia para o pacote `docs/getting-started.md`,
`docs/theming.md`, `docs/plugins.md` e o `CHANGELOG.md`, porque o guia os cita.

**Vantagem principal:** o guia acompanha sempre a versão instalada. Actualizar
a toolkit no consumidor actualiza o que o agente sabe, sem mais nenhum passo.

### 2. Skill e `CLAUDE.md` no consumidor

O schematic `ai-context` escreve, na raiz do workspace do consumidor:

- **`.claude/skills/evolium-toolkit/SKILL.md`** — uma skill que o Claude Code
  carrega sozinho quando a tarefa envolve UI, formulários, layouts, tema ou
  serviços. Manda ler `node_modules/@evolium-kit/toolkit/AGENTS.md` com Read
  (não por pesquisa), depois o README do recurso, e resume as regras.
- **Um bloco no `CLAUDE.md`** (ou em `.claude/CLAUDE.md`, se for esse o que
  existe), entre `<!-- evolium-toolkit:inicio … -->` e
  `<!-- evolium-toolkit:fim -->`. É criado se o ficheiro não existir;
  se existir, o resto do ficheiro não é tocado.

Os dois são curtos e **não têm versão** — só apontam para o índice. Não
precisam de ser regenerados a cada actualização da toolkit.

## Usar num projecto consumidor

**Instalação nova:** o `ng add` pergunta "Configurar o Claude Code para conhecer
a toolkit?" (sim por omissão; `--ai-context=false` para não).

**Projecto que já tinha a toolkit:**

```bash
npm install @evolium-kit/toolkit@latest     # versão com AGENTS.md
ng g @evolium-kit/toolkit:ai-context        # ou: ng g @evolium-kit/toolkit:ai
```

Fazer commit da `.claude/skills/evolium-toolkit/` e do `CLAUDE.md`, para toda a
equipa ter o mesmo contexto.

**Confirmar:** abrir o Claude Code no projecto e pedir, por exemplo, "que
componentes de formulário a toolkit tem?" — deve ler o `AGENTS.md` e responder
com `evo-text-field`, `evo-select`, `evo-switch`, `evoInput`…

### Regras de actualização

| Ficheiro no consumidor | Correr `ai-context` outra vez…                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md`             | actualiza-o, **se** ainda tiver a linha `<!-- gerado por ng g … -->`. Para o personalizar, apagar essa linha: passa a ser do projecto e não volta a ser tocado. |
| `CLAUDE.md`            | substitui só o bloco entre os marcadores. O resto é do projecto.                                                                                                |

### Outras ferramentas de IA

O `AGENTS.md` é markdown simples e segue a convenção `AGENTS.md`. Para Cursor,
Copilot ou outras, basta apontar as instruções do projecto para
`node_modules/@evolium-kit/toolkit/AGENTS.md`, como faz o bloco do `CLAUDE.md`.

## Manter (quem desenvolve a toolkit)

- **Regras e texto de abertura:** editar `projects/toolkit/AGENTS.base.md`
  (`{{VERSAO}}` é substituído pela versão do pacote). Escrever para quem
  **consome** a toolkit, não para quem a desenvolve.
- **O resto é gerado.** Um componente, layout, página ou símbolo exportado
  novo entra sozinho no próximo build. Para aparecer bem descrito:
  JSDoc na classe e em cada `input()`/`model()`/`output()` (a 1.ª frase vai
  para o guia), e um README na pasta do componente.
- **Texto da skill e do bloco do `CLAUDE.md`:** em
  `projects/toolkit/schematics/ai-context/conteudo.ts`. Manter o prefixo do
  marcador `<!-- evolium-toolkit:inicio` — é por ele que o bloco é encontrado
  em projectos que já o têm.
- **Verificações:**
  - `npm run test:tools` — o parser do gerador (`tools/agents-md-lib.spec.mjs`);
  - `node tools/verify-dist.mjs` — o `AGENTS.md` existe, é da versão do pacote,
    e todos os ficheiros que cita existem no `dist`;
  - `npm run test:schematics` — o `ai-context` (`ai-context.spec.ts`);
  - `node tools/verify-install.mjs` — numa instalação limpa, o `ng add` cria a
    skill e o bloco, e o `AGENTS.md` chega a `node_modules`.
- Ver o guia gerado localmente: `npm run build:lib` e abrir
  `dist/toolkit/AGENTS.md`.

## Ficheiros

```
projects/toolkit/AGENTS.base.md                  parte escrita à mão do guia
tools/generate-agents-md.mjs                     gerador (npm run gen:agents, no fim do build:lib)
tools/agents-md-lib.mjs (+ .spec.mjs)            parser do código-fonte e dos .d.ts
projects/toolkit/schematics/ai-context/          schematic: skill + bloco no CLAUDE.md
  ├─ index.ts, conteudo.ts, schema.json
  └─ ai-context.spec.ts
```
