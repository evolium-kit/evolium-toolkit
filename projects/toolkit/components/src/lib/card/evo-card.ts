import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Superfície de conteúdo.
 *
 * ```html
 * <evo-card>
 *   <h2 slot="title">Facturas</h2>
 *   <p>Conteúdo</p>
 *   <div slot="footer"><button evoButton>Ver todas</button></div>
 * </evo-card>
 * ```
 */
@Component({
  selector: 'evo-card',
  template: `
    <ng-content select="[slot=title]" />
    <ng-content />
    <ng-content select="[slot=footer]" />
  `,
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-card',
    '[attr.data-evo-variant]': 'variant()',
    '[attr.data-evo-interactive]': 'interactive() ? "" : null',
    '[attr.tabindex]': 'interactive() ? 0 : null',
  },
})
export class EvoCard {
  readonly variant = input<'plain' | 'sunken' | 'outlined' | (string & {})>('plain');
  /** Torna o cartão focável e reactivo ao rato. Usar só se o cartão inteiro for clicável. */
  readonly interactive = input(false, { transform: booleanAttribute });
}
