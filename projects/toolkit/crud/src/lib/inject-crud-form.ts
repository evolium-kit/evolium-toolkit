import { DestroyRef, Injector, Signal, computed, effect, inject, signal } from '@angular/core';
import type { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription, take } from 'rxjs';
import { EvoCrudMode } from './crud.types';
import { CrudFormSession, EVO_CRUD_FORM_SESSION } from './form-errors';

/** O que `injectCrudForm()` devolve. */
export interface EvoCrudForm<T, D> {
  /** `true` quando o formulário foi aberto pelo `injectCrudController()`. */
  readonly inController: boolean;
  /** Modo da abertura; `null` fora do controller. */
  readonly mode: Signal<EvoCrudMode | null>;
  /** O item a editar; `null` ao criar ou fora do controller. */
  readonly initial: Signal<T | null>;
  /** Mensagem geral da API (o que não coube em nenhum campo). */
  readonly formError: Signal<string | null>;
  /** Entrega o DTO ao controller. Fora dele, não faz nada. */
  submit(dto: D): void;
  /** Fecha sem gravar. Fora do controller, não faz nada. */
  cancel(): void;
  /**
   * Liga os erros da API ao `FormGroup`: cada mensagem entra como erro
   * `apiError` (texto) do campo respectivo, que o `EvoTextField`/`EvoSelect`
   * mostram tal como vem. Sai quando o utilizador mexe no campo. `onApply`
   * recebe os campos assinalados (para um assistente voltar ao passo certo).
   * Chamar uma vez, no construtor; chamadas repetidas para o mesmo form são ignoradas.
   */
  bindErrors(form: FormGroup, onApply?: (fields: readonly string[]) => void): void;
  clearErrors(): void;
}

/**
 * Ponte entre um formulário de entidade e o `injectCrudController()`.
 *
 * O mesmo componente serve dentro do modal do controller e numa rota isolada:
 * fora do controller, `submit`/`cancel` não fazem nada e o componente usa os
 * seus `input()`/`output()` normais. Chamar os dois, sem `if`:
 *
 * ```ts
 * readonly crud = injectCrudForm<Usuario, UsuarioDto>();
 * readonly usuario = input<Usuario | null>(null);
 * readonly dado = computed(() => this.usuario() ?? this.crud.initial());
 *
 * gravar(dto: UsuarioDto) {
 *   this.crud.submit(dto);
 *   this.saved.emit(dto);
 * }
 * ```
 */
export function injectCrudForm<T, D = Partial<T>>(): EvoCrudForm<T, D> {
  const sessao = inject(EVO_CRUD_FORM_SESSION, { optional: true }) as CrudFormSession<
    T,
    D
  > | null;
  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);
  const ligados = new WeakSet<FormGroup>();

  function bindErrors(form: FormGroup, onApply?: (fields: readonly string[]) => void): void {
    if (!sessao || ligados.has(form)) return;
    ligados.add(form);
    const erros = sessao.errors;

    /** Uma escuta por campo assinalado, largada quando o utilizador o corrige. */
    const escutas = new Map<string, Subscription>();
    const largar = (): void => {
      escutas.forEach((e) => e.unsubscribe());
      escutas.clear();
    };

    /** Tira só o `apiError`, sem levar os erros dos validators. */
    const retirar = (control: AbstractControl): void => {
      if (!control.errors?.['apiError']) return;
      const { apiError: _, ...restantes } = control.errors;
      control.setErrors(Object.keys(restantes).length ? restantes : null);
    };

    const esperarCorreccao = (campo: string, control: AbstractControl): void => {
      escutas.get(campo)?.unsubscribe();
      escutas.set(
        campo,
        control.valueChanges.pipe(take(1)).subscribe(() => {
          escutas.delete(campo);
          retirar(control);
          erros.clearField(campo);
        }),
      );
    };

    // `effect`, e não `linkedSignal`: o destino é o estado do FormGroup, que não é um signal.
    effect(
      () => {
        const campos = erros.fields();
        if (!Object.keys(campos).length) {
          largar();
          return;
        }

        const aplicados: string[] = [];
        const semCampo: string[] = [];
        for (const [campo, mensagem] of Object.entries(campos)) {
          const control = form.get(campo);
          if (!control) {
            semCampo.push(mensagem);
            continue;
          }
          control.setErrors({ ...(control.errors ?? {}), apiError: mensagem });
          control.markAsTouched();
          aplicados.push(campo);
          esperarCorreccao(campo, control);
        }

        erros.reportUnapplied(semCampo);
        if (aplicados.length) onApply?.(aplicados);
      },
      { injector },
    );

    destroyRef.onDestroy(largar);
  }

  return {
    inController: !!sessao,
    mode: signal(sessao?.mode ?? null).asReadonly(),
    initial: signal(sessao?.item ?? null).asReadonly(),
    formError: sessao ? sessao.errors.general : computed(() => null),
    submit: (dto) => sessao?.submit(dto),
    cancel: () => sessao?.cancel(),
    bindErrors,
    clearErrors: () => sessao?.errors.clear(),
  };
}
