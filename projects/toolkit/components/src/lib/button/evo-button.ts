import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { EvoSize, EvoVariant } from '../component-types';

/**
 * Botão.
 *
 * Aplica-se a um `<button>` ou `<a>` nativo em vez de os embrulhar, para não
 * perder semântica, foco nem comportamento de formulário.
 *
 * ```html
 * <button evoButton>Guardar</button>
 * <button evoButton variant="ghost" size="sm">Cancelar</button>
 * <button evoButton variant="danger" [loading]="aApagar()">Eliminar</button>
 * ```
 */
@Component({
  selector: 'button[evoButton], a[evoButton]',
  template: `
    @if (loading()) {
      <span class="evo-button__spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-button',
    '[attr.data-evo-variant]': 'variant()',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-block]': 'block() ? "" : null',
    '[attr.data-evo-loading]': 'loading() ? "" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    // Um <a> não tem `disabled`; desactivá-lo é retirá-lo da ordem de tabulação.
    '[attr.aria-disabled]': 'loading() ? "true" : null',
  },
})
export class EvoButton {
  readonly variant = input<EvoVariant>('solid');
  readonly size = input<EvoSize>('md');
  /** Ocupa toda a largura disponível. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Mostra o indicador de progresso e marca o botão como ocupado. */
  readonly loading = input(false, { transform: booleanAttribute });
}
