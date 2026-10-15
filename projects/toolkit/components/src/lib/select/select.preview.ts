import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { EvoSelect } from './evo-select';
import { EvoSelectOption } from './select-option';

const PROVINCIAS: EvoSelectOption<string>[] = [
  { value: 'LDA', label: 'Luanda', sublabel: 'Capital', group: 'Litoral' },
  { value: 'BGO', label: 'Bengo', group: 'Litoral' },
  { value: 'BGU', label: 'Benguela', group: 'Litoral' },
  { value: 'NAM', label: 'Namibe', group: 'Litoral' },
  { value: 'HUA', label: 'Huambo', group: 'Interior' },
  { value: 'BIE', label: 'Bié', group: 'Interior' },
  { value: 'MAL', label: 'Malanje', group: 'Interior', disabled: true },
];

/**
 * Pré-visualização para o Theme Studio: os estados lado a lado (escolhido,
 * vazio com pesquisa, múltiplo com resumo, erro, a carregar, desactivado), no
 * tamanho escolhido no Studio. Abrir um deles mostra o painel.
 */
@Component({
  selector: 'evo-select-preview',
  imports: [EvoSelect],
  template: `
    <div class="pv__stack">
      <evo-select
        label="Província"
        hint="Onde fica a sede."
        [options]="provincias"
        [size]="size() ?? 'md'"
        [required]="true"
        clearable
        [(value)]="provincia"
      />

      <evo-select
        label="Pesquisar província"
        [options]="provincias"
        [size]="size() ?? 'md'"
        searchable
        optional
      />

      <evo-select
        label="Províncias de actuação"
        [options]="provincias"
        [size]="size() ?? 'md'"
        multiple
        searchable
        selectAll
        [maxLabels]="2"
        [(value)]="varias"
      />

      <evo-select
        label="Com erro"
        [options]="provincias"
        error="Escolha uma província."
        [size]="size() ?? 'md'"
      />

      <evo-select label="A carregar" [options]="[]" loading [size]="size() ?? 'md'" />

      <evo-select
        label="Desactivado"
        [options]="provincias"
        value="HUA"
        disabled
        [size]="size() ?? 'md'"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoSelectPreview {
  readonly size = input<string | null>(null);
  protected readonly provincias = PROVINCIAS;
  protected readonly provincia = signal<string | null>('LDA');
  protected readonly varias = signal<string[]>(['LDA', 'BGU', 'HUA']);
}
