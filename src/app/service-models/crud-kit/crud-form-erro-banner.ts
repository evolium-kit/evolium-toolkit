import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Banner de erro do formulário do crud-kit — fallback para as mensagens da API que não
 * correspondem a nenhum campo do `FormGroup`. Fica dentro do modal, que permanece aberto.
 */
@Component({
  selector: 'crud-form-erro-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (mensagem()) {
      <div
        role="alert"
        class="flex items-start gap-x-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <svg
          class="mt-0.5 h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <span>{{ mensagem() }}</span>
      </div>
    }
  `,
})
export class CrudFormErroBannerComponent {
  readonly mensagem = input<string | null>(null);
}
