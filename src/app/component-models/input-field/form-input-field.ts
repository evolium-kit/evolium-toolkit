import { NgClass } from '@angular/common';
import { Component, input, forwardRef, Optional, Host, OnInit, computed, inject } from '@angular/core';
import {
  ControlContainer,
  ControlValueAccessor,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule
} from '@angular/forms';

type ErroFnOuTexto = (form: FormGroup) => string | null | boolean;
import { Directive } from '@angular/core';

@Directive({
  selector: '[leftIcon]',
  standalone: true
})
export class LeftIconDirective { }

@Directive({
  selector: '[rightIcon]',
  standalone: true
})
export class RightIconDirective { }
@Component({
  selector: 'form-input-field',
  // Lembre-se de importar as diretivas aqui para o Angular aceitá-las no ng-content selector
  imports: [FormsModule, ReactiveFormsModule, NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldInputComponentV2),
      multi: true
    }
  ],
  template: `
    <div class="flex flex-col gap-y-1 {{bgTransparent() ? 'bg-transparent' : 'bg-white'}}">
      <label [for]="id" class="text-xs font-medium text-black truncate" animate.enter="animete-titulo-1">
        {{ label() }}
        @if (optional()) {
          <span class="text-[#9A9A9A] font-normal">(opcional)</span>
        }
      </label>

      <div
        class="group flex items-center w-full px-3 pr-1 rounded-md border transition"
        [class.border-red-400]="!!__erro()"
        [class.border-[#E2E8F0]]="!__erro()"
        [class.bg-white]="true"
        [ngClass]="{
          'border outline-2 outline-red-300 border-red-500': !!__erro(),
          'border-1 focus-within:border-brand-orange-500 focus-within:outline-3 focus-within:outline-brand-orange-200': !__erro()
        }"
      >
        <div class="flex items-center justify-center text-gray-400 mr-2 shrink-0 select-none">
          <ng-content select="[leftIcon]"></ng-content>
        </div>
        <div class="flex-1">
          @if (type() === 'textarea') {
            <textarea
              (blur)="onBlur()"
              [id]="id"
              [disabled]="disabled()"
              [placeholder]="placeholder()"
              [value]="value"
              [rows]="rows()"
              (input)="updateValue($event)"
              animate.enter="animete-titulo-2"
              class="w-full py-2 text-sm text-[#585959] bg-transparent border-0 outline-none focus:ring-0 resize-none"
            ></textarea>
          } @else {

            <input
              (blur)="onBlur()"
              [id]="id"
              [disabled]="disabled()"
              [type]="type()"
              [placeholder]="placeholder()"
              [value]="value"
              (input)="updateValue($event)"
              animate.enter="animete-titulo-2"
              class="w-full py-2 text-sm text-[#585959] bg-transparent border-0 outline-none focus:ring-0"
            />
          }
        </div>
        <div class="flex items-center justify-center text-gray-400 ml-2 shrink-0 select-none">
          <ng-content select="[rightIcon]"></ng-content>
        </div>

      </div>

      <span class="min-h-2 text-xs text-red-600" role="alert">
        {{ __erro() }}
      </span>
    </div>
  `,
})
export class FormFieldInputComponentV2 implements ControlValueAccessor, OnInit {
  public parentForm!: FormGroup;
  constructor(
    @Optional() @Host() private controlContainer: ControlContainer
  ) { }

  ngOnInit(): void {
    if (this.controlContainer) {
      this.parentForm = this.controlContainer.control as FormGroup;
    }
  }

  readonly label = input<string>('');
  readonly erro = input<string | null | boolean | ErroFnOuTexto>(null);
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  readonly optional = input<boolean>(false);
  readonly inline = input<boolean>(false);
  readonly rows = input<number>(4);
  readonly disabled = input<boolean>(false);
  readonly bgTransparent = input<boolean>(false);
  id = crypto.randomUUID();
  value = '';

  __erro = computed(() => {
    if (typeof this.erro() === 'function') {
      return (this.erro() as ErroFnOuTexto)?.(this.parentForm);
    }
    return this.erro();
  });

  onChange = (_value: string) => { };
  onTouched = () => { };

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void { }

  updateValue(event: Event) {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = input.value;
    this.onChange(this.value);
    this.onTouched();
  }

  onBlur() {
    this.onTouched()
  }
}
