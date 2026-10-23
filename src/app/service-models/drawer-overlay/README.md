# app-drawer-overlay

Painel sobreposto que entra de um dos lados do ecrã — o [Drawer do JoyUI](https://v7.mui.com/joy-ui/react-drawer/)
com o estilo do projecto (backdrop desfocado, cabeçalho com título e ✕, cantos e tipografia dos
outros painéis).

Recebe **qualquer conteúdo**: não sabe nada de comandos, veículos ou formulários.

## Quando usar qual drawer

| Componente | Quando |
| --- | --- |
| `app-drawer-overlay` | Sobreposto ao ecrã, com backdrop — para conteúdo secundário que interrompe (este) |
| `app-drawer-painel` | Embutido numa coluna do layout, sem backdrop — para detalhes ao lado da lista |

## Uso

```html
<app-drawer-overlay [(aberto)]="aberto" titulo="Comandos" descricao="LD-45-67-AA" tamanho="grande">
  <p>conteúdo</p>

  <div drawerRodape class="flex gap-x-3">
    <button type="button" (click)="enviar()">Enviar</button>
  </div>
</app-drawer-overlay>
```

Com cabeçalho próprio (substitui título e descrição):

```html
<app-drawer-overlay [(aberto)]="aberto" rotulo="Detalhes do veículo" posicao="esquerda" tamanho="24rem">
  <div drawerCabecalho class="flex items-center gap-x-3">
    <img [src]="veiculo().foto" alt="" class="h-9 w-9 rounded-lg" />
    <h2 class="text-lg font-bold">{{ veiculo().matricula }}</h2>
  </div>

  <app-o-que-quiser />
</app-drawer-overlay>
```

## Inputs

| Input | Tipo | Omissão | Nota |
| --- | --- | --- | --- |
| `aberto` | `model<boolean>` | `false` | Two-way: fechar por dentro (✕, backdrop, `Esc`) escreve aqui |
| `posicao` | `'esquerda' \| 'direita' \| 'topo' \| 'fundo'` | `'direita'` | Lado de onde entra |
| `tamanho` | `'pequeno' \| 'medio' \| 'grande' \| 'total'` ou medida CSS | `'medio'` | Largura em `esquerda`/`direita`, altura em `topo`/`fundo` |
| `titulo` | `string` | `''` | Dá o nome acessível ao diálogo |
| `descricao` | `string` | `''` | Linha secundária do cabeçalho |
| `comBackdrop` | `boolean` | `true` | |
| `fecharAoClicarFora` | `boolean` | `true` | |
| `fecharComEsc` | `boolean` | `true` | |
| `comFechar` | `boolean` | `true` | Mostra o botão ✕ |
| `rotuloFechar` | `string` | `'Fechar painel'` | |
| `rotulo` | `string` | `''` | Nome acessível quando não há `titulo` |

Tamanhos nomeados: `pequeno` 20rem/16rem, `medio` 28rem/24rem, `grande` 40rem/36rem, `total` 100%
(horizontal/vertical). Qualquer medida CSS também serve: `tamanho="clamp(20rem, 50vw, 48rem)"`.

## Output

- `fechado` — emitido quando o painel se fecha por dentro. Para só saber o estado basta o `[(aberto)]`.

## Encaixes

- `[drawerCabecalho]` — cabeçalho próprio, no lugar de `titulo`/`descricao` (use `rotulo` para o nome acessível).
- `[drawerRodape]` — barra fixa no fundo, fora da área que scrola.

## Acessibilidade

- `role="dialog"` + `aria-modal="true"`, nomeado pelo `titulo` (`aria-labelledby`) ou pelo `rotulo`.
- O foco entra no painel ao abrir e volta ao elemento anterior ao fechar.
- `Tab`/`Shift+Tab` circulam dentro do painel enquanto ele está aberto.
- `Esc` fecha (desligável com `[fecharComEsc]="false"`).
- A página por trás não scrola enquanto o painel está aberto.
- A transição respeita `prefers-reduced-motion`.
