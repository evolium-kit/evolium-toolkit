import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvoButton } from '../button/evo-button';
import { EvoCard } from './evo-card';

/** Pré-visualização para o Theme Studio: título, conteúdo e rodapé. */
@Component({
  selector: 'evo-card-preview',
  imports: [EvoCard, EvoButton],
  template: `
    <div class="pv__stack">
      <evo-card [attr.data-evo-variant]="variant()">
        <h3 slot="title">Título do cartão</h3>
        <p>Conteúdo do cartão, com o espaçamento e a superfície do tema.</p>
        <div slot="footer">
          <button evoButton size="sm">Acção</button>
        </div>
      </evo-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoCardPreview {
  readonly variant = input<string | null>(null);
}
