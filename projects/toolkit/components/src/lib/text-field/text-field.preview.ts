import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { EvoTextField } from './evo-text-field';

/**
 * Pré-visualização para o Theme Studio: os estados lado a lado (normal, com
 * ícone, senha, erro, desactivado, textarea com contador), no tamanho
 * escolhido no Studio.
 */
@Component({
  selector: 'evo-text-field-preview',
  imports: [EvoTextField],
  template: `
    <div class="pv__stack">
      <evo-text-field
        label="Nome"
        hint="Como aparece nas facturas."
        placeholder="Escreve…"
        [size]="size() ?? 'md'"
        [required]="true"
        clearable
        [(value)]="nome"
      />

      <evo-text-field
        label="Pesquisar"
        type="search"
        placeholder="Procurar cliente"
        [size]="size() ?? 'md'"
      >
        <svg
          slot="prefix"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </evo-text-field>

      <evo-text-field label="Senha" type="password" value="segredo123" [size]="size() ?? 'md'" />

      <evo-text-field
        label="Email"
        type="email"
        value="nome@"
        error="Email inválido."
        [size]="size() ?? 'md'"
      />

      <evo-text-field
        label="Telefone"
        optional
        disabled
        value="923 000 000"
        [size]="size() ?? 'md'"
      />

      <evo-text-field
        label="Observações"
        type="textarea"
        [rows]="2"
        autoResize
        showCount
        [maxlength]="140"
        value="O textarea cresce com o conteúdo."
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoTextFieldPreview {
  readonly size = input<string | null>(null);
  protected readonly nome = signal('Ana Domingos');
}
