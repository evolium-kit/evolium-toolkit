import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EvoProgressBar } from './evo-progress-bar';

/**
 * Pré-visualização para o Theme Studio, desenhada num iframe.
 *
 * O componente é `position: fixed` por desenho (fica preso ao topo da
 * janela). Cada demo vive dentro de uma caixa com `transform`, que a
 * especificação CSS trata como "containing block" de um elemento fixed — a
 * barra fica presa ao topo *dessa caixa*, não do iframe inteiro, para as três
 * demos aparecerem lado a lado em vez de sobrepostas no topo real da página.
 */
@Component({
  selector: 'evo-progress-bar-preview',
  imports: [EvoProgressBar],
  template: `
    <div class="pv__stack">
      <div class="pv__estado">
        <div class="pv__progress-demo">
          <evo-progress-bar [value]="45" ariaLabel="A carregar, 45%" />
        </div>
        <span>45% (determinate)</span>
      </div>

      <div class="pv__estado">
        <div class="pv__progress-demo">
          <evo-progress-bar [value]="92" ariaLabel="A carregar, 92%" />
        </div>
        <span>92% — o brilho ("peg") acompanha a ponta</span>
      </div>

      <div class="pv__estado">
        <div class="pv__progress-demo">
          <evo-progress-bar indeterminate ariaLabel="A carregar" />
        </div>
        <span>indeterminate — sem percentagem conhecida</span>
      </div>
    </div>
  `,
  styles: `
    .pv__progress-demo {
      position: relative;
      transform: translateZ(0);
      block-size: 24px;
      overflow: hidden;
      border-radius: var(--evo-radius-sm);
      border: 1px solid var(--evo-color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoProgressBarPreview {}
