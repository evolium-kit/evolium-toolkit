import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EVO_DRAWER_DATA,
  EvoButton,
  EvoTextField,
  injectDrawerRef,
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
 * Conteúdo de exemplo para EvoDrawerService.open(): lê os dados do drawer,
 * emite um evento e fecha com o resultado.
 */
@Component({
  selector: 'app-form-motorista-drawer',
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
export class FormMotoristaDrawer {
  protected readonly dados = inject<FormMotoristaDados>(EVO_DRAWER_DATA);
  private readonly ref = injectDrawerRef<Motorista, FormMotoristaEventos>();

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
