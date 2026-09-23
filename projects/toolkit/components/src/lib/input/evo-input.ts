import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  input,
} from '@angular/core';
import { EvoSize } from '../component-types';

/**
 * Campo de texto.
 *
 * É uma directiva sobre um `<input>`/`<textarea>`/`<select>` nativo, e não um
 * componente que os embrulhe: mantém `ngModel`, `formControlName`, validação
 * nativa e preenchimento automático do browser intactos.
 *
 * ```html
 * <label for="email">Email</label>
 * <input evoInput id="email" type="email" formControlName="email" />
 * ```
 *
 * Por ser directiva, os seus estilos vivem na folha global
 * `styles/evolium-components.css` — não há template onde os encapsular.
 */
@Directive({
  selector: 'input[evoInput], textarea[evoInput], select[evoInput]',
  host: {
    class: 'evo-input',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-invalid]': 'invalid() ? "" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class EvoInput {
  readonly size = input<EvoSize>('md');
  /** Marca o campo como inválido, para o utilizador e para os leitores de ecrã. */
  readonly invalid = input(false, { transform: booleanAttribute });
}

/**
 * Contentor de campo: agrupa etiqueta, controlo e mensagem de ajuda ou erro.
 *
 * ```html
 * <evo-field>
 *   <label for="email">Email</label>
 *   <input evoInput id="email" [invalid]="erro()" aria-describedby="email-erro" />
 *   <span slot="error" id="email-erro">Email inválido.</span>
 * </evo-field>
 * ```
 *
 * O `aria-describedby` é responsabilidade de quem usa: ligar a mensagem ao
 * campo não pode ser adivinhado a partir da projecção de conteúdo.
 *
 * Os estilos vivem na folha global `styles/evolium-components.css`, e não num
 * `styleUrl`: com `ViewEncapsulation.Emulated`, o conteúdo projectado recebe o
 * atributo do componente **pai**, pelo que um estilo encapsulado aqui nunca
 * alcançaria o `<label>` nem os slots.
 */
@Component({
  selector: 'evo-field',
  template: `
    <ng-content select="label" />
    <ng-content />
    <ng-content select="[slot=hint]" />
    <ng-content select="[slot=error]" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-field' },
})
export class EvoField {}
