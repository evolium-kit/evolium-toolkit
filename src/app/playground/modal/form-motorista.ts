import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EVO_MODAL_DATA,
  EvoButton,
  EvoTextField,
  injectModalRef,
} from '@evolium-kit/toolkit/components';

export interface Motorista {
  readonly nome: string;
  readonly carta: string;
}

export interface FormMotoristaDados {
  readonly mode: 'create' | 'edit';
  readonly motorista?: Motorista;
}

export interface FormMotoristaEventos {
  readonly rascunho: Partial<Motorista>;
}

/**
 * Conteúdo de exemplo para EvoModalService.open(): lê os dados do modal,
 * emite um evento e fecha com o resultado.
 */
@Component({
  selector: 'app-form-motorista',
  imports: [ReactiveFormsModule, EvoTextField, EvoButton],
  template: `
    <form style="display: grid; gap: 1rem" [formGroup]="form" (ngSubmit)="gravar()">
      <evo-text-field formControlName="nome" label="Nome" autocomplete="name" />
      <evo-text-field formControlName="carta" label="Carta de condução" hint="Ex.: LD-12345" />
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end">
        <button evoButton variant="ghost" type="button" (click)="rascunho()">
          Guardar rascunho
        </button>
        <button evoButton type="submit">{{ dados.mode === 'edit' ? 'Gravar' : 'Registar' }}</button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormMotorista {
  protected readonly dados = inject<FormMotoristaDados>(EVO_MODAL_DATA);
  private readonly ref = injectModalRef<Motorista, FormMotoristaEventos>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    nome: [this.dados.motorista?.nome ?? '', Validators.required],
    carta: [this.dados.motorista?.carta ?? '', Validators.required],
  });

  protected gravar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.ref.close(this.form.getRawValue());
  }

  protected rascunho(): void {
    this.ref.emit('rascunho', this.form.getRawValue());
  }
}
