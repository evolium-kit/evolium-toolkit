import { TOOLKIT } from '../utils/constants';

/**
 * Textos que o `ai-context` escreve no projecto consumidor.
 *
 * São deliberadamente **curtos e sem versão**: só apontam para
 * `node_modules/@evolium-kit/toolkit/AGENTS.md`, que viaja dentro do pacote e
 * é regenerado em cada build da toolkit. Assim, actualizar a toolkit actualiza
 * o que o agente sabe, sem voltar a correr este gerador.
 */

const GUIA = `node_modules/${TOOLKIT}/AGENTS.md`;

/** Marca os ficheiros gerados. Sem ela, o gerador não volta a tocar no ficheiro. */
export const MARCA_GERADO = `<!-- gerado por ng g ${TOOLKIT}:ai-context — apagar esta linha para personalizar (deixa de ser actualizado) -->`;

export const CAMINHO_SKILL = '.claude/skills/evolium-toolkit/SKILL.md';

export const SKILL = `---
name: evolium-toolkit
description: Usar sempre que a tarefa envolva a ${TOOLKIT} neste projecto — criar ou alterar UI (botões, campos de texto, selects, switches, cartões, badges), formulários, layouts/shells, páginas de autenticação, 404, tema, tokens --evo-*, modo escuro, Theme Studio, serviços HTTP, plugins do kernel ou autenticação. Dá o inventário exacto da versão instalada (componentes, inputs, tokens, serviços, geradores) e as regras para a usar sem partir o tema nem o SSR.
---

${MARCA_GERADO}

# ${TOOLKIT} neste projecto

Este projecto usa a ${TOOLKIT}: componentes de UI temáveis, layouts, páginas
prontas, tema por tokens e um kernel de serviços por plugins. **Antes de
escrever código novo, confirma se a toolkit já o oferece.**

## Onde está a informação

1. **Ler primeiro \`${GUIA}\`** — o índice da versão **instalada**: entry
   points, todos os componentes (selector, inputs com tipo e omissão, tokens),
   layouts, páginas, tokens de tema, serviços, geradores e as regras de uso.
2. Depois, o README do recurso em causa. Os caminhos no índice são relativos a
   \`node_modules/${TOOLKIT}/\` (ex.: \`components/src/lib/select/README.md\`).
3. Para a assinatura exacta de um símbolo:
   \`node_modules/${TOOLKIT}/types/evolium-kit-toolkit-<entry>.d.ts\`.

**Usar a ferramenta Read com estes caminhos exactos.** O \`node_modules\` está
no \`.gitignore\` e a pesquisa (Grep/Glob) ignora-o: procurar a toolkit por
pesquisa dá "não encontrado" mesmo com ela instalada.

A versão instalada está em \`node_modules/${TOOLKIT}/package.json\`; as
alterações por versão em \`node_modules/${TOOLKIT}/CHANGELOG.md\`.

Se \`AGENTS.md\` não existir, a toolkit instalada é anterior a este guia: ler
\`node_modules/${TOOLKIT}/README.md\` e os README de cada entry point, e
sugerir actualizar (\`npm install ${TOOLKIT}@latest\`).

## Regras essenciais (lista completa no índice)

- Reutilizar componentes, layouts e páginas da toolkit; importar só de
  \`${TOOLKIT}/{core,theme,components,layouts,pages,services}\`.
- Angular moderno: standalone, zoneless, \`OnPush\`, signals,
  \`input()\`/\`output()\`/\`model()\`; SSR-safe (nada de \`window\`/\`localStorage\`
  fora de \`afterNextRender()\`/\`isPlatformBrowser()\`).
- Aparência **só por tokens \`--evo-*\`** (\`:root\`, variante, \`[evoTokens]\`):
  nunca \`::ng-deep\`, nunca reescrever classes \`.evo-*\`, nunca cores literais.
  Em \`[evoTokens]\` usar o nome curto completo (\`'text-field-ring-width'\`).
- Serviços HTTP como plugins (\`withPlugin(…)\`); autenticação e cabeçalhos
  globais em \`sharedInterceptors\`; erros por \`ctx.toError\`; \`ctx.storage\`.
- Preferir os geradores: \`ng g ${TOOLKIT}:page|layout|ui-component|resource-plugin\`
  (com \`--dry-run\` primeiro).
`;

/** A parte estável do marcador de início — é por ela que o bloco é encontrado. */
export const PREFIXO_INICIO = '<!-- evolium-toolkit:inicio';
export const INICIO_BLOCO = `${PREFIXO_INICIO} — gerado por ng g ${TOOLKIT}:ai-context; não editar entre os marcadores -->`;
export const FIM_BLOCO = '<!-- evolium-toolkit:fim -->';

export const BLOCO_CLAUDE_MD = `${INICIO_BLOCO}

## ${TOOLKIT}

Este projecto usa a ${TOOLKIT}. Antes de criar ou alterar UI, formulários,
layouts, páginas, tema/tokens ou serviços, ler \`${GUIA}\` — o índice da
versão instalada (ou deixar a skill \`evolium-toolkit\` fazê-lo). Ler os
caminhos do índice com Read: o \`node_modules\` é ignorado pela pesquisa.

- Reutilizar o que a toolkit oferece antes de criar componentes ou serviços.
- Aparência só por tokens \`--evo-*\`; nunca \`::ng-deep\` nem cores literais.
- Gerar com \`ng g ${TOOLKIT}:<page|layout|ui-component|resource-plugin>\`.

${FIM_BLOCO}`;
