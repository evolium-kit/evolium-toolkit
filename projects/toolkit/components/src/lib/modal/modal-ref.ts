import { InjectionToken, Signal, inject, signal } from '@angular/core';
import { EvoModalOverlay } from './modal-overlay';
import { EvoModalCloseReason, EvoModalEvents } from './modal.types';

/**
 * Dados passados em `open(…, { data })`, para o componente ou template do
 * modal. Tipar no ponto de uso: `inject<Motorista>(EVO_MODAL_DATA)`.
 */
export const EVO_MODAL_DATA = new InjectionToken<unknown>('EVO_MODAL_DATA');

/**
 * Referência a um modal aberto pelo `EvoModalService`. Quem abre recebe-a de
 * `open()`; o conteúdo do modal obtém-na com `injectModalRef()`.
 *
 * - `R` — o resultado com que o modal fecha;
 * - `E` — os eventos que o conteúdo pode emitir (`{ pago: { id: number } }`).
 */
export class EvoModalRef<R = unknown, E extends object = EvoModalEvents> {
  private readonly aberto = signal(true);
  private readonly listeners = new Map<keyof E, Set<(payload: never) => void>>();
  private overlay: EvoModalOverlay<R> | null = null;
  private resolver!: (result: R | undefined) => void;
  private razao: EvoModalCloseReason | null = null;

  /** `true` enquanto o modal estiver aberto. */
  readonly isOpen: Signal<boolean> = this.aberto.asReadonly();

  /**
   * Resolve com o resultado quando o modal fecha, seja de que forma for.
   * Fechar pelo Escape, pelo fundo ou pelo × dá `undefined`. Nunca rejeita.
   */
  readonly closed: Promise<R | undefined> = new Promise((resolve) => (this.resolver = resolve));

  constructor(
    /** Identificador, para `EvoModalService.close(id)`. */
    readonly id: string,
    /** O fragmento da URL a que o modal está ligado, se algum. */
    readonly fragment: string | null = null,
  ) {}

  /** Porque fechou. `null` enquanto estiver aberto. */
  get closeReason(): EvoModalCloseReason | null {
    return this.razao;
  }

  /** Fecha já, com `result`, sem passar pelo `beforeClose`. */
  close(result?: R): void {
    if (this.overlay) this.overlay.fechar(result, 'programmatic');
    else this.terminar(result, 'programmatic');
  }

  /**
   * Fecha como se o utilizador tivesse carregado no × — passa pelo
   * `beforeClose`. Resolve `true` se fechou.
   */
  requestClose(): Promise<boolean> {
    return this.overlay ? this.overlay.pedirFecho('close-button') : Promise.resolve(false);
  }

  /** Emite um evento para os listeners de `open(…, { on })` e de `on()`. */
  emit<K extends keyof E>(name: K, payload: E[K]): void {
    for (const fn of this.listeners.get(name) ?? []) (fn as (p: E[K]) => void)(payload);
  }

  /** Ouve um evento do conteúdo. Devolve a função que deixa de ouvir. */
  on<K extends keyof E>(name: K, fn: (payload: E[K]) => void): () => void {
    let set = this.listeners.get(name);
    if (!set) this.listeners.set(name, (set = new Set()));
    set.add(fn as (payload: never) => void);
    return () => set.delete(fn as (payload: never) => void);
  }

  /** @internal Liga a referência ao overlay do CDK. Só para o `EvoModalService`. */
  _ligar(overlay: EvoModalOverlay<R>): void {
    this.overlay = overlay;
  }

  /** @internal Fecha com o motivo dado, sem `beforeClose` (acções do rodapé). */
  _fecharComo(result: R | undefined, reason: EvoModalCloseReason): void {
    if (this.overlay) this.overlay.fechar(result, reason);
    else this.terminar(result, reason);
  }

  /** @internal Marca o modal como fechado e resolve `closed`. */
  _terminar(result: R | undefined, reason: EvoModalCloseReason): void {
    this.terminar(result, reason);
  }

  private terminar(result: R | undefined, reason: EvoModalCloseReason): void {
    if (!this.aberto()) return;
    this.razao = reason;
    this.aberto.set(false);
    this.overlay = null;
    this.listeners.clear();
    this.resolver(result);
  }
}

/**
 * A referência do modal em que o componente actual está a ser mostrado.
 *
 * ```ts
 * export class FormMotorista {
 *   private readonly ref = injectModalRef<Motorista, { gravado: Motorista }>();
 *   gravar(m: Motorista) { this.ref.emit('gravado', m); this.ref.close(m); }
 * }
 * ```
 */
export function injectModalRef<R = unknown, E extends object = EvoModalEvents>(): EvoModalRef<
  R,
  E
> {
  return inject<EvoModalRef<R, E>>(EvoModalRef);
}
