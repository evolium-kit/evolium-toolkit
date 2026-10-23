import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { EVO_DRAWER_MESSAGES } from './drawer.messages';
import { EvoDrawerPosition, EvoDrawerSize } from './drawer.types';

const TAMANHOS_NOMEADOS = new Set(['sm', 'md', 'lg', 'full']);

/**
 * A caixa visível de um drawer: cabeçalho (título/descrição), corpo, rodapé
 * e botão ×.
 *
 * É o que o `<evo-drawer>` e o `EvoDrawerService` desenham dentro do
 * `Dialog` do CDK, e não abre nada por si.
 *
 * Os slots são os do `<evo-drawer>`: `slot="header"` (substitui título e
 * descrição), o corpo (por omissão) e `slot="footer"`. Uma zona sem
 * conteúdo não ocupa espaço.
 */
@Component({
  selector: 'evo-drawer-panel',
  template: `
    <div class="evo-drawer-panel__header">
      <ng-content select="[slot=header]" />
      <div class="evo-drawer-panel__header-default">
        @if (heading()) {
          <h2 [id]="titleId() || null" class="evo-drawer-panel__title">{{ heading() }}</h2>
        }
        @if (description()) {
          <p [id]="descriptionId() || null" class="evo-drawer-panel__description">
            {{ description() }}
          </p>
        }
      </div>
    </div>

    <div class="evo-drawer-panel__body"><ng-content /></div>
    <div class="evo-drawer-panel__footer"><ng-content select="[slot=footer]" /></div>

    @if (showClose()) {
      <!--
        Depois do corpo e do rodapé no DOM, de propósito: o CDK dá o foco
        inicial ao primeiro elemento focável do diálogo, e deve ser um campo
        do conteúdo, não o ×. A posição visual (canto superior) é por CSS.
      -->
      <button
        type="button"
        class="evo-drawer-panel__close"
        [attr.aria-label]="mensagens.close"
        (click)="dismiss.emit()"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    }
  `,
  styleUrl: './drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-drawer-panel',
    '[attr.data-evo-position]': 'position()',
    '[attr.data-evo-size]': 'size()',
    '[style.inline-size]': 'estiloEixo().largura',
    '[style.block-size]': 'estiloEixo().altura',
  },
})
export class EvoDrawerPanel {
  readonly heading = input('');
  readonly description = input('');
  readonly position = input<EvoDrawerPosition>('right');
  readonly size = input<EvoDrawerSize>('md');
  readonly showClose = input(true);
  /** `id` do título, para o `aria-labelledby` do diálogo. */
  readonly titleId = input('');
  /** `id` da descrição, para o `aria-describedby` do diálogo. */
  readonly descriptionId = input('');

  /** Clique no ×. Quem abriu o drawer decide se fecha (`beforeClose`). */
  readonly dismiss = output<void>();

  protected readonly mensagens = inject(EVO_DRAWER_MESSAGES);

  /**
   * Um tamanho fora dos nomeados (`sm`/`md`/`lg`/`full`) é uma medida CSS
   * literal (ex.: `'32rem'`, `'40%'`, `'clamp(20rem, 50vw, 48rem)'`) — os
   * tokens só cobrem os nomeados, por isso esta aplica-se directo no eixo
   * do deslize (largura em `left`/`right`, altura em `top`/`bottom`).
   */
  protected readonly estiloEixo = computed(() => {
    const tamanho = this.size();
    if (TAMANHOS_NOMEADOS.has(tamanho)) return {};

    const horizontal = this.position() === 'left' || this.position() === 'right';
    return horizontal ? { largura: tamanho } : { altura: tamanho };
  });
}
