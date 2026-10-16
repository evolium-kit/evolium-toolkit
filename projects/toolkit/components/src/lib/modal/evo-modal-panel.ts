import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { EVO_MODAL_MESSAGES } from './modal.messages';
import { EvoModalSize, EvoModalTone } from './modal.types';

/**
 * A caixa visível de um modal: ícone, título, corpo, rodapé e botão ×.
 *
 * É o que o `<evo-modal>` e o `EvoModalService` desenham dentro do `Dialog`
 * do CDK, e não abre nada por si. Usá-la directamente só faz sentido para
 * mostrar um modal estático (pré-visualizações, documentação) ou dentro de
 * um contentor próprio.
 *
 * Os slots são os do `<evo-modal>`: `slot="icon"`, `slot="title"`, o corpo
 * (por omissão) e `slot="footer"`. Uma zona sem conteúdo não ocupa espaço.
 */
@Component({
  selector: 'evo-modal-panel',
  template: `
    <div class="evo-modal-panel__icon" aria-hidden="true">
      <ng-content select="[slot=icon]" />
      <!-- Um ícone em slot="icon" esconde este (folha global, regra ~). -->
      @if (tone()) {
        <svg
          class="evo-modal-panel__tone-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          @switch (tone()) {
            @case ('success') {
              <circle cx="12" cy="12" r="10" />
              <path d="m8 12.5 2.5 2.5L16 9.5" />
            }
            @case ('danger') {
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            }
            @case ('warning') {
              <path
                d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              />
              <path d="M12 9v4M12 17h.01" />
            }
            @case ('question') {
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
            }
            @default {
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            }
          }
        </svg>
      }
    </div>

    <h2 class="evo-modal-panel__title" [id]="titleId() || null">
      @if (heading()) {
        {{ heading() }}
      }
      <ng-content select="[slot=title]" />
    </h2>

    <div class="evo-modal-panel__body"><ng-content /></div>
    <div class="evo-modal-panel__footer"><ng-content select="[slot=footer]" /></div>

    @if (showClose()) {
      <button
        class="evo-modal-panel__close"
        type="button"
        [attr.aria-label]="mensagens.close"
        (click)="dismiss.emit()"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    }
  `,
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-modal-panel',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-tone]': 'tone() || null',
  },
})
export class EvoModalPanel {
  readonly heading = input('');
  readonly tone = input<EvoModalTone | null | undefined>(null);
  readonly size = input<EvoModalSize>('md');
  readonly showClose = input(true, { transform: booleanAttribute });
  /** `id` do título, para o `aria-labelledby` do diálogo. */
  readonly titleId = input('');

  /** Clique no ×. Quem abriu o modal decide se fecha (`beforeClose`). */
  readonly dismiss = output<void>();

  protected readonly mensagens = inject(EVO_MODAL_MESSAGES);
}
