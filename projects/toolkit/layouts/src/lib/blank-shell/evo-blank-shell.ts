import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shell mínimo: centra e limita a largura do conteúdo.
 *
 * Para páginas públicas, landings e ecrãs de erro — tudo o que não precisa de
 * navegação nem de cartão de autenticação.
 */
@Component({
  selector: 'evo-blank-shell',
  template: `
    <div class="evo-blank-shell__conteudo">
      <ng-content />
    </div>
  `,
  styles: `
    @layer evo.components {
      :host {
        display: block;
        min-block-size: 100dvh;
        padding: var(--evo-space-lg) var(--evo-space-md);
        background-color: var(--evo-color-surface-sunken);
        color: var(--evo-color-on-surface);
        font-family: var(--evo-font-sans);
      }

      :host([data-evo-center]) {
        display: grid;
        place-items: center;
      }

      .evo-blank-shell__conteudo {
        inline-size: 100%;
        max-inline-size: var(--evo-blank-shell-width, 60rem);
        margin-inline: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-blank-shell',
    '[attr.data-evo-center]': 'center() ? "" : null',
  },
})
export class EvoBlankShell {
  /** Centra verticalmente. Útil para páginas de erro. */
  readonly center = input(false);
}
