import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvoTone } from '../component-types';

/**
 * Etiqueta de estado.
 *
 * ```html
 * <evo-badge>Rascunho</evo-badge>
 * <evo-badge tone="success">Pago</evo-badge>
 * <evo-badge tone="danger" label="3 facturas vencidas">3</evo-badge>
 * ```
 */
@Component({
  selector: 'evo-badge',
  template: `<ng-content />`,
  styleUrl: './badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-badge',
    '[attr.data-evo-tone]': 'tone()',
    // Um badge com só um número não diz nada a quem não o vê.
    '[attr.aria-label]': 'label() || null',
    '[attr.role]': 'label() ? "status" : null',
  },
})
export class EvoBadge {
  readonly tone = input<EvoTone>('neutral');
  /** Descrição para leitores de ecrã, quando o conteúdo visível não basta. */
  readonly label = input<string>('');
}
