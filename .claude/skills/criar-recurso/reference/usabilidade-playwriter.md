# Medir uma biblioteca de referência no Chrome (Playwriter)

Usa-se na Fase 1b do `/criar-recurso`, modo `novo` com referência, e no modo `doc` quando há
uma demo pública. O objectivo é **registar o comportamento real**, não o que a documentação
diz ou o que se espera. Cada linha do resultado entra na tabela "medido → decisão".

## Antes de começar

- O MCP `playwriter` tem de estar ligado (`claude mcp list`) e a extensão Chrome activa no
  separador. Se as ferramentas `mcp__playwriter__*` falharem, `reset` (`mcp__playwriter__reset`).
- **Não feches nem reutilizes os separadores do utilizador.** Lista-os (`context.pages()`),
  abre o teu e guarda-o em `state.pg`. Se o teu separador desaparecer, volta a listar.
- Em cada passo, confirma `pg.url()` — um clique mal dirigido navega para outra página.

## Regras do ambiente (aprendidas à custa de tempo perdido)

| Facto                                                                          | O que fazer                                                                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Cada `execute` tem **10 s**; além disso dá `timed out` e perde-se o que correu | Passos curtos (3–6 acções, `waitForTimeout` de 150–300 ms). Devolve o resultado por `console.log` no fim.                      |
| `globalThis` não persiste entre chamadas; `state` persiste                     | Guarda a página e as funções auxiliares em `state.*`.                                                                          |
| `locator.click()`/`hover()` pode ficar pendurado em "performing click action"  | Calcula o centro do elemento com `getBoundingClientRect()` num `evaluate` e usa `page.mouse.click(x, y)` / `mouse.move(x, y)`. |
| Cliques em coordenadas fixas acertam no que lá estiver (logótipo, link)        | Nunca por coordenadas fixas: sempre pelo centro de um elemento que encontraste.                                                |
| `mouse.wheel` pode pendurar                                                    | `window.scrollBy(0, n)` num `evaluate`.                                                                                        |
| `screenshot` pode pendurar numa página pesada                                  | `clip` à região e `timeout: 6000`, num passo à parte. Depois `Read` da imagem.                                                 |
| O primeiro carregamento do `ng serve` responde 1–2 s atrasado                  | Espera 3–5 s antes de medir. Não confundas isto com um defeito do componente: confirma num componente que não tocaste.         |
| Um `document.activeElement` pode ser o `<body>`                                | Regista-o sempre: "o foco perdeu-se" é um achado.                                                                              |

## Auxiliares úteis (colar uma vez em `state`)

```js
// Estado do menu/painel aberto e do foco, numa linha.
state.s3 = async () =>
  await state.pg.evaluate(() => {
    const a = document.activeElement;
    const painel = document.querySelector('[role=menu], [role=listbox], [role=dialog]');
    return (
      'active=' +
      a.tagName +
      ':' +
      a.textContent.trim().slice(0, 14) +
      ' painel=' +
      (painel ? painel.getAttribute('role') : 'fechado')
    );
  });
// Clique no centro de um elemento (nunca por coordenadas fixas).
state.cl = async (sel) => {
  const r = await state.pg.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return [b.x + b.width / 2, b.y + b.height / 2];
  }, sel);
  if (!r) return 'sem elemento';
  await state.pg.mouse.click(r[0], r[1]);
  await state.pg.waitForTimeout(300);
  return 'ok';
};
```

Marca os elementos de cada demo com `setAttribute('data-t', 'x')` e usa `[data-t=x]`: assim
as chamadas seguintes não dependem do texto nem da posição.

## O que medir, por tipo de componente

Para **cada** demo e variante da referência. Regista o valor, não "funciona".

**Todos**

- Estado inicial (atributos ARIA, `tabindex`, role, largura/altura medidas).
- Cada estado: desactivado, seleccionado, erro, a carregar, só de leitura. Os atributos
  **saem** ao sair do estado?
- Claro e escuro; tamanhos; dentro de um modal/drawer.
- Nome acessível: o elemento tem nome? Vem de onde?

**Overlays (menu, popover, select, tooltip, dropdown)**

- Abrir: clique, Enter, Espaço, ↓, ↑ (no gatilho). Onde fica o foco ao abrir?
- Fechar: Escape, clique no gatilho, clique fora, Tab, escolher um item. Onde fica o foco **depois**?
- Escape dentro de um modal/drawer: fecha só o overlay, ou o modal também?
- Navegação: ↓/↑ (rotação?), Home/End, escrita rápida (com buffer? quanto tempo?), itens
  desactivados (saltados ou focáveis?), separadores.
- Rato: o foco segue o hover? clique num item desactivado? clique fora devolve o foco?
- Posição: medir o `getBoundingClientRect` do painel e do gatilho; a folga; encostar o gatilho
  ao fundo do ecrã e ver se vira; `window.scrollBy` com o painel aberto (acompanha? bloqueia?).
- Largura: do gatilho ou do conteúdo? mínima? máxima e scroll interno com muitos itens?
- Aninhado (submenus): setas, hover, Escape fecha só o de cima, três níveis.
- Controlado (`open` por código): o foco entra no painel?

**Formulários (input, select, autocomplete)**

- Valor escolhido vs texto visível; o que o formulário recebe; apagar tudo; sair com texto
  parcial; erro `required`; `reset()`; desactivado pelo formulário.

**Tabelas/listas** — ordenação, selecção, teclado nas linhas, estados vazios/erro/a carregar,
dados assíncronos (latência, falha, cancelamento).

## Da medição à decisão

Para cada linha medida escolhe um de: **manter** (igual), **corrigir** (a referência tem um
defeito: ARIA em falta, foco perdido), **acrescentar** (a referência não tem
e o CDK/o padrão ARIA dá de graça), **deixar de fora** (e diz porquê). A tabela vai para o
relatório da Fase 2 e, resumida, para a secção "Referência" do README do recurso.

Depois de implementar, **repete as mesmas sequências** no playground e compara linha a linha.
As diferenças que aparecem aí (e só aí) vão para as notas do `RESOURCE-MIGRATE.md`.
