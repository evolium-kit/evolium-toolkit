import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Lado de onde o painel entra, como o `anchor` do Drawer do JoyUI. */
export type PosicaoDrawer = 'esquerda' | 'direita' | 'topo' | 'fundo';

/**
 * Medida do painel no eixo em que ele desliza: largura em `esquerda`/`direita`,
 * altura em `topo`/`fundo`. Além dos tamanhos nomeados aceita qualquer medida CSS
 * (`'32rem'`, `'40%'`, `'clamp(20rem, 50vw, 48rem)'`).
 */
export type TamanhoDrawer = 'pequeno' | 'medio' | 'grande' | 'total' | (string & {});

/** Tempo da transição de entrada/saída — tem de bater com a classe `duration-300`. */
const DURACAO_TRANSICAO_MS = 300;

const MEDIDAS_HORIZONTAIS: Record<string, string> = {
  pequeno: '20rem',
  medio: '28rem',
  grande: '40rem',
  total: '100%',
};

const MEDIDAS_VERTICAIS: Record<string, string> = {
  pequeno: '16rem',
  medio: '24rem',
  grande: '36rem',
  total: '100%',
};

/** Ancoragem e sentido do deslize de cada posição. */
const ANCORAGENS: Record<PosicaoDrawer, { ancora: string; dentro: string; fora: string }> = {
  esquerda: { ancora: 'left-0 top-0 h-full', dentro: 'translate-x-0', fora: '-translate-x-full' },
  direita: { ancora: 'right-0 top-0 h-full', dentro: 'translate-x-0', fora: 'translate-x-full' },
  topo: { ancora: 'top-0 left-0 w-full', dentro: 'translate-y-0', fora: '-translate-y-full' },
  fundo: { ancora: 'bottom-0 left-0 w-full', dentro: 'translate-y-0', fora: 'translate-y-full' },
};

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Cabeçalho próprio, no lugar do título e descrição padrão. */
@Directive({ selector: '[drawerCabecalho]' })
export class DrawerCabecalhoDirective {}

/** Barra fixa no fundo do painel (ex: botões de acção). */
@Directive({ selector: '[drawerRodape]' })
export class DrawerRodapeDirective {}

/** Dá um `id` único a cada título, para o `aria-labelledby` não colidir entre painéis. */
let instanciasCriadas = 0;

/**
 * Painel sobreposto que entra de um dos lados do ecrã — o Drawer do JoyUI com o
 * estilo do projecto: backdrop desfocado, cantos e tipografia dos outros painéis.
 *
 * Recebe qualquer conteúdo (`<ng-content>`), com dois pontos de encaixe opcionais:
 * `[drawerCabecalho]` para substituir o título e `[drawerRodape]` para uma barra
 * fixa no fundo (ex: botões de acção).
 *
 * ```html
 * <app-drawer-overlay [(aberto)]="aberto" titulo="Comandos" tamanho="grande">
 *   <p>conteúdo</p>
 *   <div drawerRodape><button>Enviar</button></div>
 * </app-drawer-overlay>
 * ```
 *
 * Por omissão entra da direita, em tamanho médio, com backdrop que fecha ao
 * clique e `Esc` a fechar. Difere do `app-drawer-painel`, que não é sobreposto:
 * esse ocupa uma coluna do layout da página.
 */
@Component({
  selector: 'app-drawer-overlay',
  templateUrl: './drawer-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'aoTeclarEsc()',
  },
})
export class DrawerOverlayComponent {
  /** Estado do painel. Two-way: fechar por dentro (backdrop, `Esc`, ✕) escreve aqui. */
  readonly aberto = model(false);

  readonly posicao = input<PosicaoDrawer>('direita');
  readonly tamanho = input<TamanhoDrawer>('medio');

  readonly titulo = input('');
  readonly descricao = input('');

  readonly comBackdrop = input(true);
  readonly fecharAoClicarFora = input(true);
  readonly fecharComEsc = input(true);
  readonly comFechar = input(true);
  readonly rotuloFechar = input('Fechar painel');
  /** Nome acessível quando não há `titulo` (nem cabeçalho próprio com um). */
  readonly rotulo = input('');

  readonly fechado = output<void>();

  private readonly painel = viewChild<ElementRef<HTMLElement>>('painel');
  private readonly ehNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Presença dos encaixes opcionais: sem eles não se desenha a moldura deles. */
  protected readonly cabecalhoProprio = contentChild(DrawerCabecalhoDirective);
  protected readonly rodape = contentChild(DrawerRodapeDirective);

  /** No DOM. Fica `true` antes de `deslizado` para a transição de entrada correr. */
  protected readonly visivel = signal(false);
  /** Painel na posição final; `false` deixa-o fora do ecrã (entrada e saída). */
  protected readonly deslizado = signal(false);

  /** Identificador estável para o `aria-labelledby` apontar ao título deste painel. */
  protected readonly idTitulo = `drawer-titulo-${++instanciasCriadas}`;

  private temporizadorFecho?: ReturnType<typeof setTimeout>;
  private overflowAnterior: string | null = null;
  private elementoComFoco: HTMLElement | null = null;

  protected readonly classesPainel = computed(() => {
    const { ancora, dentro, fora } = ANCORAGENS[this.posicao()];
    return `${ancora} ${this.deslizado() ? dentro : fora}`;
  });

  /** A medida aplica-se ao eixo do deslize; no outro o painel ocupa tudo. */
  protected readonly largura = computed(() =>
    this.ehHorizontal() ? this.medida(MEDIDAS_HORIZONTAIS) : '100%',
  );
  protected readonly altura = computed(() =>
    this.ehHorizontal() ? '100%' : this.medida(MEDIDAS_VERTICAIS),
  );

  constructor() {
    effect(() => {
      if (this.aberto()) this.mostrar();
      else this.esconder();
    });

    if (isDevMode()) {
      effect(() => {
        if (this.titulo() || this.rotulo()) return;
        console.warn(
          '[app-drawer-overlay] Sem `titulo` nem `rotulo`: o painel fica sem nome acessível.',
        );
      });
    }

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.temporizadorFecho);
      this.libertarScroll();
    });
  }

  /** Fecha o painel: escreve no `aberto` (two-way) e avisa quem o abriu. */
  fechar(): void {
    if (!this.aberto()) return;

    this.aberto.set(false);
    this.fechado.emit();
  }

  protected aoClicarBackdrop(): void {
    if (this.fecharAoClicarFora()) this.fechar();
  }

  protected aoTeclarEsc(): void {
    if (this.aberto() && this.fecharComEsc()) this.fechar();
  }

  /**
   * Mantém o Tab dentro do painel: por ser modal, chegar aos elementos por trás
   * deixaria o teclado perdido num ecrã que o rato não consegue alcançar.
   */
  protected aoTeclarTab(evento: Event): void {
    // Com modificadores de tecla (`keydown.shift.tab`) o Angular tipa o evento como
    // `Event`; é sempre um evento de teclado.
    if (!(evento instanceof KeyboardEvent)) return;

    const focaveis = [...(this.painel()?.nativeElement.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS) ?? [])].filter(
      (elemento) => elemento.offsetParent !== null,
    );
    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const ativo = document.activeElement;

    if (evento.shiftKey && (ativo === primeiro || ativo === this.painel()?.nativeElement)) {
      evento.preventDefault();
      ultimo.focus();
      return;
    }

    if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  private ehHorizontal(): boolean {
    const posicao = this.posicao();
    return posicao === 'esquerda' || posicao === 'direita';
  }

  private medida(nomeadas: Record<string, string>): string {
    const tamanho = this.tamanho();
    return nomeadas[tamanho] ?? tamanho;
  }

  private mostrar(): void {
    clearTimeout(this.temporizadorFecho);
    this.visivel.set(true);
    this.bloquearScroll();

    if (!this.ehNavegador) {
      this.deslizado.set(true);
      return;
    }

    this.elementoComFoco = document.activeElement as HTMLElement | null;

    // O painel tem de ser pintado fora do ecrã antes de receber a posição final,
    // senão o browser não tem de onde animar e ele aparece já colocado.
    requestAnimationFrame(() => {
      this.deslizado.set(true);
      this.painel()?.nativeElement.focus({ preventScroll: true });
    });
  }

  private esconder(): void {
    if (!this.visivel()) return;

    this.deslizado.set(false);
    this.libertarScroll();

    // Sai do DOM só depois de a transição de saída acabar.
    this.temporizadorFecho = setTimeout(() => this.visivel.set(false), DURACAO_TRANSICAO_MS);

    this.elementoComFoco?.focus({ preventScroll: true });
    this.elementoComFoco = null;
  }

  /** Sem isto a página por trás scrolava com a roda do rato sobre o backdrop. */
  private bloquearScroll(): void {
    if (!this.ehNavegador || this.overflowAnterior !== null) return;

    this.overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private libertarScroll(): void {
    if (!this.ehNavegador || this.overflowAnterior === null) return;

    document.body.style.overflow = this.overflowAnterior;
    this.overflowAnterior = null;
  }
}
