import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvoButton } from './evo-button';

/**
 * Pré-visualização para o Theme Studio: todos os estados lado a lado, para se
 * ver logo se um override partiu o `hover`, o foco ou o `disabled`.
 */
@Component({
  selector: 'evo-button-preview',
  imports: [EvoButton],
  template: `
    <div class="pv__row">
      <button evoButton [attr.data-evo-variant]="variant()" [attr.data-evo-size]="size()">
        Normal
      </button>
      <button
        evoButton
        class="pv--hover"
        [attr.data-evo-variant]="variant()"
        [attr.data-evo-size]="size()"
      >
        Hover
      </button>
      <button
        evoButton
        class="pv--focus"
        [attr.data-evo-variant]="variant()"
        [attr.data-evo-size]="size()"
      >
        Foco
      </button>
      <button evoButton disabled [attr.data-evo-variant]="variant()" [attr.data-evo-size]="size()">
        Desactivado
      </button>
      <button
        evoButton
        [loading]="true"
        [attr.data-evo-variant]="variant()"
        [attr.data-evo-size]="size()"
      >
        A carregar
      </button>
    </div>
  `,
  styles: `
    @layer evo.components {
      /*
       * Estados forçados. Não há forma fiável de simular :hover e
       * :focus-visible por script, por isso reproduz-se a aparência a partir
       * dos mesmos tokens que o componente usa.
       */
      .pv--hover {
        background-color: var(--evo-button-bg-hover, var(--evo-color-primary-hover));
      }

      .pv--focus {
        outline: var(--evo-focus-ring-width) solid var(--evo-focus-ring-color);
        outline-offset: var(--evo-focus-ring-offset);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoButtonPreview {
  readonly variant = input<string | null>(null);
  readonly size = input<string | null>(null);
}
