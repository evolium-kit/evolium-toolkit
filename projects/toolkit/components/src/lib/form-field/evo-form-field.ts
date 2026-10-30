import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * @deprecated Sobrepõe-se a `EvoField` (`<evo-field>` + `input[evoInput]`) e ao
 * `EvoTextField`, e não tem consumidores na toolkit. Usar um destes.
 */
@Component({
  selector: 'evo-form-field',
  template: `<ng-content />`,
  styleUrl: './form-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-form-field',
    '[attr.data-evo-disabled]': 'disabled() ? "" : null',
  },
})
export class EvoFormField {
  readonly disabled = input(false, { transform: booleanAttribute });
}
