import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

/** Progresso mínimo (%) ao arrancar, para não parecer uma barra inerte. */
const MINIMO = 8;
/** Progresso máximo (%) que o "trickle" atinge sozinho — nunca chega aos 100. */
const TECTO = 99.4;
/** Intervalo (ms) entre incrementos automáticos do "trickle". */
const INTERVALO_TRICKLE = 200;

function incremento(valorActual: number): number {
  if (valorActual >= 80) return 0.5;
  if (valorActual >= 50) return 2;
  if (valorActual >= 20) return 4;
  return 10;
}

/**
 * Barra de progresso fina, fixa no topo da página.
 *
 * Dois modos: `manual`, controlado por `[value]` (0–100; `null` mostra uma
 * variante indeterminate — um segmento a deslizar, sem percentagem conhecida);
 * `router`, autossuficiente — ouve o `Router` e simula o avanço (entra,
 * "treme" até perto dos 100%, salta ao concluir), ao estilo do NProgress. Uma
 * navegação nova reinicia a barra, mesmo a meio de outra.
 *
 * ```html
 * <evo-progress-bar mode="router" ariaLabel="A mudar de página" />
 *
 * <evo-progress-bar [value]="progressoUpload()" ariaLabel="A enviar ficheiro" />
 * ```
 *
 * Aparência por tokens: `--evo-progress-bar-height`, `-color`, `-duration`,
 * `-z-index`, `-glow-color`, `-indeterminate-duration`. Ver README.md.
 */
@Component({
  selector: 'evo-progress-bar',
  template: `
    <div class="evo-progress-bar__track">
      @if (indeterminado()) {
        <div class="evo-progress-bar__bar evo-progress-bar__bar--sweep"></div>
      } @else {
        <div class="evo-progress-bar__bar" [style.--pb-progresso.%]="progresso()"></div>
      }
    </div>
  `,
  styleUrl: './progress-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-progress-bar',
    role: 'progressbar',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuemin]': 'semValor() ? null : 0',
    '[attr.aria-valuemax]': 'semValor() ? null : 100',
    '[attr.aria-valuenow]': 'semValor() ? null : progresso()',
    '[attr.aria-hidden]': 'estado() === "oculto" ? "true" : null',
    '[attr.data-evo-modo]': 'mode()',
    '[attr.data-evo-indeterminado]': 'indeterminado() ? "" : null',
    '[attr.data-evo-estado]': 'estado()',
  },
})
export class EvoProgressBar {
  /**
   * `manual`: o progresso vem de `[value]`. `router`: a própria barra ouve o
   * `Router` e decide o progresso sozinha — `value` é ignorado.
   */
  readonly mode = input<'manual' | 'router'>('manual');
  /**
   * Progresso em modo `manual`, 0–100. `null` oculta a barra — ou, se quiseres
   * mostrar que algo está a acontecer sem percentagem conhecida, usa
   * `indeterminate` em vez de deixar a `null`.
   */
  readonly value = input<number | null>(null);
  /** Progresso indeterminado em modo `manual` — ignora `value`. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Nome acessível do `role="progressbar"`. */
  readonly ariaLabel = input('A carregar');

  private readonly plataforma = inject(PLATFORM_ID);
  private readonly esNavegador = isPlatformBrowser(this.plataforma);
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly valorRouter = signal(0);
  private readonly estadoRouter = signal<'oculto' | 'activo' | 'a-concluir'>('oculto');
  private idIntervalo: ReturnType<typeof setInterval> | undefined;
  private idEsconder: ReturnType<typeof setTimeout> | undefined;

  protected readonly progresso = computed(() =>
    this.mode() === 'manual' ? (this.value() ?? 0) : this.valorRouter(),
  );
  protected readonly indeterminado = computed(
    () => this.mode() === 'manual' && this.indeterminate(),
  );
  /** Sem `aria-valuenow`/`-min`/`-max`: oculta, ou indeterminate. */
  protected readonly semValor = computed(() => this.estado() === 'oculto' || this.indeterminado());
  /** Estado visual único — também o atributo `data-evo-estado` do host. */
  protected readonly estado = computed<'activo' | 'a-concluir' | 'oculto'>(() =>
    this.mode() === 'manual'
      ? this.value() !== null || this.indeterminate()
        ? 'activo'
        : 'oculto'
      : this.estadoRouter(),
  );

  constructor() {
    if (this.esNavegador && this.router) {
      const subscricao = this.router.events.subscribe((evento) => {
        if (this.mode() !== 'router') return;

        if (evento instanceof NavigationStart) {
          this.reiniciar();
        } else if (
          evento instanceof NavigationEnd ||
          evento instanceof NavigationCancel ||
          evento instanceof NavigationError ||
          evento instanceof NavigationSkipped
        ) {
          this.concluir();
        }
      });
      this.destroyRef.onDestroy(() => subscricao.unsubscribe());
    }

    this.destroyRef.onDestroy(() => {
      clearInterval(this.idIntervalo);
      clearTimeout(this.idEsconder);
    });
  }

  private reiniciar(): void {
    clearInterval(this.idIntervalo);
    clearTimeout(this.idEsconder);
    this.estadoRouter.set('activo');
    this.valorRouter.set(MINIMO);
    this.idIntervalo = setInterval(() => {
      this.valorRouter.update((n) => Math.min(TECTO, n + incremento(n)));
    }, INTERVALO_TRICKLE);
  }

  private concluir(): void {
    if (this.estadoRouter() === 'oculto') return;
    clearInterval(this.idIntervalo);
    this.estadoRouter.set('a-concluir');
    this.valorRouter.set(100);
    // 2× --evo-progress-bar-duration (120ms de omissão): a mesma janela em que o
    // CSS desvanece a opacidade neste estado (ver progress-bar.css).
    this.idEsconder = setTimeout(() => {
      this.estadoRouter.set('oculto');
      this.valorRouter.set(0);
    }, 240);
  }
}
