import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

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
