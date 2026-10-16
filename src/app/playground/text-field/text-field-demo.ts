import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvoButton, EvoCard, EvoTextField } from '@evolium-kit/toolkit/components';

/** `<evo-text-field>` com Reactive Forms: erro automático, prefixo/sufixo, textarea. */
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

  protected submeterRegisto(): void {
    this.registo.markAllAsTouched();
  }

  protected alternarRegisto(): void {
    if (this.registo.disabled) this.registo.enable();
    else this.registo.disable();
  }
}
