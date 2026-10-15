import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { EvoSwitch } from './evo-switch';

/**
 * Pré-visualização para o Theme Studio: os estados fixos lado a lado e um
 * interruptor interactivo, para ver a transição com os tokens em edição.
 */
@Component({
  selector: 'evo-switch-preview',
  imports: [EvoSwitch],
  template: `
    <div class="pv__row">
      <span class="pv__estado">
        <evo-switch [(checked)]="ligado" ariaLabelledby="pv-switch-interactivo" />
        <span id="pv-switch-interactivo">{{ ligado() ? 'Ligado' : 'Desligado' }} (clica)</span>
      </span>
      <span class="pv__estado">
        <evo-switch ariaLabel="Desligado" />
        Desligado
      </span>
      <span class="pv__estado">
        <evo-switch [checked]="true" ariaLabel="Ligado" />
        Ligado
      </span>
      <span class="pv__estado">
        <evo-switch disabled ariaLabel="Desactivado, desligado" />
        Desactivado
      </span>
      <span class="pv__estado">
        <evo-switch disabled [checked]="true" ariaLabel="Desactivado, ligado" />
        Desactivado, ligado
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoSwitchPreview {
  protected readonly ligado = signal(true);
}
