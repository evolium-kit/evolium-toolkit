import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvoBadge } from './evo-badge';

/** Pré-visualização para o Theme Studio: texto curto, número e texto longo. */
@Component({
  selector: 'evo-badge-preview',
  imports: [EvoBadge],
  template: `
    <div class="pv__row">
      <evo-badge [attr.data-evo-tone]="variant()">Etiqueta</evo-badge>
      <evo-badge [attr.data-evo-tone]="variant()">12</evo-badge>
      <evo-badge [attr.data-evo-tone]="variant()">Texto bastante mais longo</evo-badge>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoBadgePreview {
  /** No badge, a "variante" do Studio é o `tone`. */
  readonly variant = input<string | null>(null);
}
