import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EvoButton,
  EvoCard,
  EvoSelect,
  EvoSelectOption,
  EvoSelectOptionDef,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';

/**
 * `<evo-select>`: simples, múltiplo, `compareWith`, template de opção,
 * pesquisa no servidor, tokens por instância e painel não cortado pelo
 * contentor.
 */
@Component({
  selector: 'app-select-demo',
  imports: [
    EvoCard,
    EvoButton,
    EvoSelect,
    EvoSelectOptionDef,
    EvoTokensDirective,
    ReactiveFormsModule,
    JsonPipe,
  ],
  templateUrl: './select-demo.html',
  styleUrls: ['../shared/demo.css', './select-demo.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDemo {
  protected readonly provincias: EvoSelectOption<number>[] = [
    { value: 1, label: 'Luanda', sublabel: 'Capital', group: 'Litoral' },
    { value: 2, label: 'Bengo', group: 'Litoral' },
    { value: 3, label: 'Benguela', group: 'Litoral' },
    { value: 4, label: 'Namibe', group: 'Litoral' },
    { value: 5, label: 'Cabinda', group: 'Litoral' },
    { value: 6, label: 'Huambo', group: 'Interior' },
    { value: 7, label: 'Bié', group: 'Interior' },
    { value: 8, label: 'Huíla', group: 'Interior' },
    { value: 9, label: 'Malanje', group: 'Interior', disabled: true },
    { value: 10, label: 'Cuando Cubango', group: 'Interior' },
  ];

  protected readonly gestores: EvoSelectOption<
    { id: number },
    { iniciais: string; cargo: string }
  >[] = [
    { value: { id: 1 }, label: 'Ana Domingos', data: { iniciais: 'AD', cargo: 'Comercial' } },
    { value: { id: 2 }, label: 'Bruno Neto', data: { iniciais: 'BN', cargo: 'Financeiro' } },
    { value: { id: 3 }, label: 'Celma Paulo', data: { iniciais: 'CP', cargo: 'Operações' } },
  ];

  protected readonly mesmoId = (a: { id: number } | null, b: { id: number } | null) =>
    a?.id === b?.id;

  protected readonly escolhas = inject(NonNullableFormBuilder).group({
    provincia: [null as number | null, Validators.required],
    actuacao: [[1, 3] as number[]],
    // Outra referência, o mesmo id: o compareWith encontra-o.
    gestor: [{ id: 2 } as { id: number } | null],
  });

  protected submeterEscolhas(): void {
    this.escolhas.markAllAsTouched();
  }

  protected alternarEscolhas(): void {
    if (this.escolhas.disabled) this.escolhas.enable();
    else this.escolhas.disable();
  }

  protected readonly provinciaLaranja = signal<number | null>(6);

  private readonly todosClientes = [
    'Sonangol',
    'Unitel',
    'Africell',
    'Banco BAI',
    'Banco BIC',
    'ENDE',
    'EPAL',
    'TAAG',
    'Angomart',
  ].map((nome, i) => ({ value: `c${i}`, label: nome }));
  protected readonly clientes = signal<EvoSelectOption<string>[]>(this.todosClientes);
  protected readonly aPesquisarClientes = signal(false);
  protected readonly cliente = signal<string | null>(null);
  private pesquisaClientes?: ReturnType<typeof setTimeout>;

  /** Simula uma API: 400 ms depois de a pessoa parar de escrever. */
  protected pesquisarClientes(termo: string): void {
    clearTimeout(this.pesquisaClientes);
    this.aPesquisarClientes.set(true);
    this.pesquisaClientes = setTimeout(() => {
      const t = termo.toLowerCase();
      this.clientes.set(this.todosClientes.filter((c) => c.label.toLowerCase().includes(t)));
      this.aPesquisarClientes.set(false);
    }, 400);
  }
}
