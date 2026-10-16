import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { EvoCard, EvoField, EvoFormField, EvoInput } from '@evolium-kit/toolkit/components';

/** `<evo-field>` / `<evo-form-field>` com `evoInput`: rótulo, ajuda e erro manuais. */
@Component({
  selector: 'app-field-demo',
  imports: [EvoCard, EvoField, EvoFormField, EvoInput],
  templateUrl: './field-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldDemo {
  protected readonly emailInvalido = signal(false);
}
