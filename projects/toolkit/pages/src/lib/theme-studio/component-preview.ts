import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvoBadge, EvoButton, EvoCard, EvoField, EvoInput } from '@evolium-kit/toolkit/components';

/**
 * Pré-visualização de um componente em todos os seus estados ao mesmo tempo.
 *
 * Mostrar os estados lado a lado é deliberado: é assim que se vê logo se um
 * override partiu o `hover`, o `disabled` ou o foco — coisas que passariam
 * despercebidas num preview de estado único.
 *
 * Os componentes da toolkit são renderizados por `@switch` sobre o `id`. Um
 * componente de fora do pacote fornece o seu próprio preview através do campo
 * `preview` do `EvoComponentMeta`.
 */
@Component({
  selector: 'evo-component-preview',
  imports: [EvoButton, EvoCard, EvoBadge, EvoInput, EvoField],
  template: `
    @switch (componentId()) {
      @case ('button') {
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
          <button
            evoButton
            disabled
            [attr.data-evo-variant]="variant()"
            [attr.data-evo-size]="size()"
          >
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
      }

      @case ('input') {
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
            <input evoInput id="pv-off" disabled value="Não editável" />
          </evo-field>
        </div>
      }

      @case ('card') {
        <div class="pv__stack">
          <evo-card [attr.data-evo-variant]="variant()">
            <h3 slot="title">Título do cartão</h3>
            <p>Conteúdo do cartão, com o espaçamento e a superfície do tema.</p>
            <div slot="footer">
              <button evoButton size="sm">Acção</button>
            </div>
          </evo-card>
        </div>
      }

      @case ('badge') {
        <div class="pv__row">
          <evo-badge [attr.data-evo-tone]="variant()">Etiqueta</evo-badge>
          <evo-badge [attr.data-evo-tone]="variant()">12</evo-badge>
          <evo-badge [attr.data-evo-tone]="variant()">Texto bastante mais longo</evo-badge>
        </div>
      }

      @default {
        <p class="pv__vazio">
          Sem pré-visualização para <code>{{ componentId() }}</code> . Um componente de fora da
          toolkit fornece a sua no campo <code>preview</code> dos metadados.
        </p>
      }
    }
  `,
  styleUrl: './component-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-component-preview' },
})
export class EvoComponentPreview {
  readonly componentId = input.required<string>();
  /** Variante seleccionada, ou vazio para a aparência por omissão. */
  readonly variant = input<string | null>(null);
  readonly size = input<string | null>(null);
}
