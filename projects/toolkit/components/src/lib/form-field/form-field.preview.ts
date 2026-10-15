import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EvoFormField } from './evo-form-field';

/** Pré-visualização para o Theme Studio: normal e desactivado. */
@Component({
  selector: 'evo-form-field-preview',
  imports: [EvoFormField],
  template: `
    <div class="pv__stack">
      <evo-form-field>Conteúdo do campo</evo-form-field>
      <evo-form-field disabled>Desactivado</evo-form-field>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoFormFieldPreview {}
