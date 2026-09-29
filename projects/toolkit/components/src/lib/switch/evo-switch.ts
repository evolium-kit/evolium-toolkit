import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Interruptor ligado/desligado.
 *
 * Funciona sozinho, com `[(checked)]`, ou dentro de um formulário, com
 * `formControlName` ou `[(ngModel)]` — implementa `ControlValueAccessor`.
 *
 * ```html
 * <evo-switch [(checked)]="notificacoes" ariaLabel="Receber notificações" />
 *
 * <span id="rotulo-2fa">Autenticação em dois passos</span>
 * <evo-switch formControlName="doisPassos" ariaLabelledby="rotulo-2fa" />
 * ```
 *
 * Aparência por tokens: `--evo-switch-bg`, `--evo-switch-bg-checked`,
 * `--evo-switch-thumb-bg`, `--evo-switch-thumb-size` e `--evo-switch-radius`.
 * Ver README.md desta pasta.
 */
@Component({
  selector: 'evo-switch',
  template: `
    <button
      class="evo-switch__track"
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [disabled]="inactivo()"
      (click)="alternar()"
      (blur)="aoTocar()"
    >
      <span class="evo-switch__thumb" aria-hidden="true"></span>
    </button>
  `,
  styleUrl: './switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EvoSwitch), multi: true },
  ],
  host: {
    class: 'evo-switch',
    '[attr.data-evo-checked]': 'checked() ? "" : null',
    '[attr.data-evo-disabled]': 'inactivo() ? "" : null',
  },
})
export class EvoSwitch implements ControlValueAccessor {
  /** Estado do interruptor. Suporta `[(checked)]`. */
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Nome acessível. O `role="switch"` fica no botão interno, por isso um
   * `aria-label` posto no host não chega até ele — tem de vir por aqui. Usar um
   * dos dois: `ariaLabel` com o texto, ou `ariaLabelledby` com o id de um rótulo
   * já visível no ecrã.
   */
  readonly ariaLabel = input('');
  readonly ariaLabelledby = input('');

  /** Desactivado pelo formulário (`control.disable()`), à parte do input. */
  private readonly desactivadoPeloForm = signal(false);

  protected readonly inactivo = computed(() => this.disabled() || this.desactivadoPeloForm());

  private aoMudarForm: (valor: boolean) => void = () => {};
  private aoTocarForm: () => void = () => {};

  protected alternar(): void {
    if (this.inactivo()) return;
    const valor = !this.checked();
    this.checked.set(valor);
    this.aoMudarForm(valor);
  }

  protected aoTocar(): void {
    this.aoTocarForm();
  }

  // ------------------------------------------------- ControlValueAccessor

  writeValue(valor: unknown): void {
    this.checked.set(!!valor);
  }

  registerOnChange(fn: (valor: boolean) => void): void {
    this.aoMudarForm = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocarForm = fn;
  }

  setDisabledState(desactivado: boolean): void {
    this.desactivadoPeloForm.set(desactivado);
  }
}
