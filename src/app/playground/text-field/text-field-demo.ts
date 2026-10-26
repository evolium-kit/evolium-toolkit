import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvoButton, EvoCard, EvoSelectOption, EvoTextField } from '@evolium-kit/toolkit/components';

const PROVINCIAS = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando',
  'Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Icolo e Bengo',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Moxico Leste',
  'Namibe',
  'Uíge',
  'Zaire',
];

/** `<evo-text-field>` com Reactive Forms: erro automático, prefixo/sufixo, textarea, autoComplete. */
@Component({
  selector: 'app-text-field-demo',
  imports: [EvoCard, EvoButton, EvoTextField, ReactiveFormsModule, JsonPipe],
  templateUrl: './text-field-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldDemo {
  protected readonly registo = inject(NonNullableFormBuilder).group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
    valor: [null as number | null, Validators.min(0)],
    obs: [''],
  });

  /** O `value` de cada opção é o código, o `label` o nome: o formulário recebe o código. */
  protected readonly provincias: EvoSelectOption<string>[] = PROVINCIAS.map((nome) => ({
    value: nome.toLowerCase().replaceAll(' ', '-'),
    label: nome,
    sublabel: 'Angola',
  }));

  protected readonly morada = inject(NonNullableFormBuilder).group({
    provincia: [null as string | null, Validators.required],
    bairro: [''],
  });

  protected submeterMorada(): void {
    this.morada.markAllAsTouched();
  }

  protected submeterRegisto(): void {
    this.registo.markAllAsTouched();
  }

  protected alternarRegisto(): void {
    if (this.registo.disabled) this.registo.enable();
    else this.registo.disable();
  }
}
