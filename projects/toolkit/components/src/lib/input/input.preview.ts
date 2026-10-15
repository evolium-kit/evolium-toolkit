import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvoField, EvoInput } from './evo-input';

/** Pré-visualização para o Theme Studio: normal, com erro e desactivado. */
@Component({
  selector: 'evo-input-preview',
  imports: [EvoInput, EvoField],
  template: `
    <div class="pv__stack">
      <evo-field>
        <label for="pv-normal">Normal</label>
        <input evoInput id="pv-normal" [attr.data-evo-size]="size()" placeholder="Escreve…" />
        <span slot="hint">Texto de ajuda.</span>
      </evo-field>

      <evo-field>
        <label for="pv-erro">Com erro</label>
        <input
          evoInput
          id="pv-erro"
          [invalid]="true"
          [attr.data-evo-size]="size()"
          value="valor inválido"
          aria-describedby="pv-erro-msg"
        />
        <span slot="error" id="pv-erro-msg">Mensagem de erro.</span>
      </evo-field>

      <evo-field>
        <label for="pv-off">Desactivado</label>
        <input evoInput id="pv-off" disabled value="Não editável" [attr.data-evo-size]="size()" />
      </evo-field>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoInputPreview {
  readonly size = input<string | null>(null);
}
