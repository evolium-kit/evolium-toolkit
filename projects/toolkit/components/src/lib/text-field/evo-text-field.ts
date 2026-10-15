import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { EvoSize } from '../component-types';
import { EvoField } from '../input/evo-input';
import { EVO_TEXT_FIELD_MESSAGES, EvoErrorMessage } from './text-field.messages';

/* eslint-disable @typescript-eslint/ban-types */

/** Tipo do campo. `textarea` troca o `<input>` por um `<textarea>`. */
export type EvoTextFieldType =
  'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number' | 'textarea' | (string & {});

/**
 * Função que decide a mensagem de erro a partir do controlo. Devolve `null`
 * (ou `''`) para não mostrar erro. Recebe `null` se não houver formulário.
 */
export type EvoTextFieldErrorFn = (control: AbstractControl | null) => string | null;

/**
 * Contador de módulo, e não `crypto.randomUUID()`: não depende de APIs do
 * browser nem de contexto seguro, e corre igual no servidor.
 */
let proximoId = 0;

/**
 * Campo de texto completo numa só tag: etiqueta, controlo, ícones, ajuda, erro
 * e contador.
 *
 * Compõe o `EvoField` (disposição, etiqueta) e o aspecto do `EvoInput` (a
 * caixa usa a classe `evo-input`), por isso herda os tokens `--evo-input-*` e
 * `--evo-field-*`. Só os `--evo-text-field-*` são próprios.
 *
 * ```html
 * <evo-text-field formControlName="email" label="Email" type="email" autocomplete="email" />
 * ```
 *
 * Implementa `ControlValueAccessor` pelo `NgControl` (e não por
 * `NG_VALUE_ACCESSOR`), para poder ler o estado do controlo e mostrar o erro
 * sem configuração. Ver README.md desta pasta.
 */
@Component({
  selector: 'evo-text-field',
  imports: [EvoField],
  template: `
    <evo-field>
      @if (label()) {
        <label class="evo-text-field__label" [for]="id">
          {{ label() }}
          @if (obrigatorio()) {
            <span class="evo-text-field__required" aria-hidden="true">*</span>
          } @else if (optional()) {
            <span class="evo-text-field__optional">{{ mensagens.optional }}</span>
          }
        </label>
      }

      <div
        class="evo-input evo-text-field__box"
        [attr.data-evo-size]="size()"
        [attr.data-evo-invalid]="invalido() ? '' : null"
        (click)="focarSeFora($event)"
      >
        <span class="evo-text-field__prefix"><ng-content select="[slot=prefix]" /></span>

        @if (type() === 'textarea') {
          <textarea
            #controlo
            class="evo-text-field__control"
            [id]="id"
            [value]="value()"
            [rows]="rows()"
            [style.min-block-size]="autoResize() ? rows() + 'lh' : null"
            [attr.data-evo-auto-resize]="autoResize() ? '' : null"
            [disabled]="inactivo()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [attr.autocomplete]="autocomplete() || null"
            [attr.inputmode]="inputmode() || null"
            [attr.maxlength]="maxlength() ?? null"
            [attr.aria-invalid]="invalido() ? 'true' : null"
            [attr.aria-required]="obrigatorio() ? 'true' : null"
            [attr.aria-describedby]="descritoPor()"
            (input)="aoEscrever($event)"
            (blur)="aoSair()"
          ></textarea>
        } @else {
          <input
            #controlo
            class="evo-text-field__control"
            [id]="id"
            [type]="tipoNativo()"
            [value]="value()"
            [disabled]="inactivo()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [attr.autocomplete]="autocomplete() || null"
            [attr.inputmode]="inputmode() || null"
            [attr.maxlength]="maxlength() ?? null"
            [attr.aria-invalid]="invalido() ? 'true' : null"
            [attr.aria-required]="obrigatorio() ? 'true' : null"
            [attr.aria-describedby]="descritoPor()"
            (input)="aoEscrever($event)"
            (blur)="aoSair()"
          />
        }

        @if (mostraLimpar()) {
          <button
            type="button"
            class="evo-text-field__action evo-text-field__clear"
            [attr.aria-label]="mensagens.clear"
            [attr.aria-controls]="id"
            (click)="limpar()"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }

        @if (type() === 'password') {
          <button
            type="button"
            class="evo-text-field__action evo-text-field__toggle"
            [attr.aria-label]="senhaVisivel() ? mensagens.hidePassword : mensagens.showPassword"
            [attr.aria-pressed]="senhaVisivel()"
            [attr.aria-controls]="id"
            [disabled]="inactivo()"
            (click)="alternarSenha()"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              @if (senhaVisivel()) {
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 5.4-1.6"
                />
              } @else {
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              }
            </svg>
          </button>
        }

        <span class="evo-text-field__suffix"><ng-content select="[slot=suffix]" /></span>
      </div>

      <div class="evo-text-field__footer">
        <!-- Sempre no DOM: uma região aria-live só anuncia mudanças se já existir. -->
        <span
          class="evo-text-field__message"
          [id]="mensagemId"
          [attr.data-evo-tone]="mensagemErro() ? 'error' : null"
          aria-live="polite"
          >{{ mensagemErro() || hint() }}</span
        >
        @if (showCount()) {
          <span class="evo-text-field__counter" [id]="contadorId">
            {{ value().length }}{{ maxlength() ? ' / ' + maxlength() : '' }}
          </span>
        }
      </div>
    </evo-field>
  `,
  styleUrl: './text-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-text-field',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-invalid]': 'invalido() ? "" : null',
    '[attr.data-evo-disabled]': 'inactivo() ? "" : null',
    '[attr.data-evo-readonly]': 'readonly() ? "" : null',
    '[attr.data-evo-hide-label]': 'hideLabel() ? "" : null',
  },
})
export class EvoTextField implements ControlValueAccessor, AfterViewInit {
  /** Valor. Suporta `[(value)]`, para usar sem formulários. */
  readonly value = model('');

  readonly label = input('');
  /** Esconde a etiqueta visualmente, mantendo-a para leitores de ecrã. */
  readonly hideLabel = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  /**
   * Erro manual. Tem prioridade sobre o erro automático do controlo. Texto
   * fixo, ou função que recebe o controlo e devolve a mensagem (ou `null`).
   */
  readonly error = input<string | null | undefined | EvoTextFieldErrorFn>(null);
  /** Mensagens por chave de erro, só para este campo. */
  readonly errorMessages = input<Readonly<Record<string, EvoErrorMessage>> | null>(null);

  readonly type = input<EvoTextFieldType>('text');
  readonly placeholder = input('');
  readonly size = input<EvoSize>('md');
  /** Mostra "(opcional)" na etiqueta. Ignorado se o campo for obrigatório. */
  readonly optional = input(false, { transform: booleanAttribute });
  /**
   * Força obrigatório (`true`) ou não (`false`). Por omissão é lido do
   * controlo: `Validators.required` mostra o asterisco e `aria-required`.
   */
  readonly required = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v === undefined ? undefined : booleanAttribute(v)),
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });

  readonly autocomplete = input('');
  readonly inputmode = input('');
  readonly maxlength = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });

  /** Linhas do `textarea`. Com `autoResize`, é a altura mínima. */
  readonly rows = input(4, { transform: numberAttribute });
  /** `textarea` cresce com o conteúdo (`field-sizing: content`). */
  readonly autoResize = input(false, { transform: booleanAttribute });
  /** Mostra o número de caracteres (e o máximo, se houver `maxlength`). */
  readonly showCount = input(false, { transform: booleanAttribute });
  /** Botão × para apagar o valor. */
  readonly clearable = input(false, { transform: booleanAttribute });

  protected readonly id = `evo-text-field-${proximoId++}`;
  protected readonly mensagemId = `${this.id}-mensagem`;
  protected readonly contadorId = `${this.id}-contador`;
  protected readonly mensagens = inject(EVO_TEXT_FIELD_MESSAGES);

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly controlo =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('controlo');

  /** O estado do controlo não é um signal: isto muda a cada evento dele. */
  private readonly versaoControlo = signal(0);
  private readonly desactivadoPeloForm = signal(false);
  protected readonly senhaVisivel = signal(false);

  protected readonly inactivo = computed(() => this.disabled() || this.desactivadoPeloForm());

  protected readonly tipoNativo = computed(() =>
    this.type() === 'password' && this.senhaVisivel() ? 'text' : this.type(),
  );

  protected readonly obrigatorio = computed(() => {
    const forcado = this.required();
    if (forcado !== undefined) return forcado;
    this.versaoControlo();
    return this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  });

  protected readonly mensagemErro = computed<string | null>(() => {
    const manual = this.error();
    this.versaoControlo();
    const controlo = this.ngControl?.control ?? null;

    if (typeof manual === 'function') return manual(controlo) || null;
    if (manual) return manual;
    if (!controlo?.touched || !controlo.errors) return null;

    const [chave, detalhe] = Object.entries(controlo.errors)[0];
    // Um erro que já traz a mensagem (ex.: vindo da API) usa-se tal como vem.
    if (typeof detalhe === 'string' && detalhe.trim()) return detalhe;

    const mensagem = this.errorMessages()?.[chave] ?? this.mensagens.errors[chave];
    if (mensagem === undefined) return this.mensagens.fallbackError;
    return typeof mensagem === 'function' ? mensagem(detalhe) : mensagem;
  });

  protected readonly invalido = computed(() => !!this.mensagemErro());

  protected readonly mostraLimpar = computed(
    () => this.clearable() && !!this.value() && !this.inactivo() && !this.readonly(),
  );

  protected readonly descritoPor = computed(() => {
    const ids = [];
    if (this.mensagemErro() || this.hint()) ids.push(this.mensagemId);
    if (this.showCount()) ids.push(this.contadorId);
    return ids.length ? ids.join(' ') : null;
  });

  private aoMudarForm: (valor: unknown) => void = () => {};
  private aoTocarForm: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  /**
   * Só aqui o `ngControl.control` existe com `formControlName`: a directiva
   * cria-o no seu `ngOnChanges`, que corre depois do `ngOnInit` deste componente.
   */
  ngAfterViewInit(): void {
    const controlo = this.ngControl?.control;
    if (!controlo) return;
    controlo.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.versaoControlo.update((v) => v + 1));
    this.versaoControlo.update((v) => v + 1);
  }

  protected aoEscrever(evento: Event): void {
    const bruto = (evento.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value.set(bruto);
    this.aoMudarForm(this.paraForm(bruto));
  }

  /** `touched` só ao sair do campo — o erro não aparece a meio da escrita. */
  protected aoSair(): void {
    this.aoTocarForm();
  }

  protected limpar(): void {
    this.value.set('');
    this.aoMudarForm(this.paraForm(''));
    this.controlo()?.nativeElement.focus();
  }

  protected alternarSenha(): void {
    this.senhaVisivel.update((v) => !v);
  }

  /** Um clique na caixa (no padding ou num ícone) foca o campo. */
  protected focarSeFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (alvo.closest('button, a, input, textarea')) return;
    this.controlo()?.nativeElement.focus();
  }

  /** `type="number"` entrega um número ao formulário, como o accessor nativo. */
  private paraForm(bruto: string): unknown {
    if (this.type() !== 'number') return bruto;
    return bruto === '' ? null : Number(bruto);
  }

  // ------------------------------------------------- ControlValueAccessor

  writeValue(valor: unknown): void {
    this.value.set(valor == null ? '' : String(valor));
  }

  registerOnChange(fn: (valor: unknown) => void): void {
    this.aoMudarForm = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocarForm = fn;
  }

  setDisabledState(desactivado: boolean): void {
    this.desactivadoPeloForm.set(desactivado);
  }
}
