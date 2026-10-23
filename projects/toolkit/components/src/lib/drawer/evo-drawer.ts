import { Dialog } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewContainerRef,
  afterRenderEffect,
  booleanAttribute,
  effect,
  inject,
  input,
  isDevMode,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EvoDrawerPanel } from './evo-drawer-panel';
import { EvoDrawerOverlay, abrirEvoDrawer, tokensEmLinha } from './drawer-overlay';
import {
  EvoDrawerBaseConfig,
  EvoDrawerBeforeCloseFn,
  EvoDrawerCloseReason,
  EvoDrawerPosition,
  EvoDrawerSize,
} from './drawer.types';

/**
 * Contador de módulo, e não `crypto.randomUUID()`: não depende de APIs do
 * browser e corre igual no servidor.
 */
let proximoId = 0;

/**
 * Painel sobreposto que entra de um dos lados do ecrã, aberto e fechado por
 * `[(open)]`.
 *
 * Assenta no `Dialog` do `@angular/cdk`: focus trap, Escape, bloqueio do
 * scroll da página, devolução do foco a quem abriu e `aria-modal` vêm de lá.
 * O conteúdo é desenhado no fim do `<body>`; os `[evoTokens]` postos no
 * `<evo-drawer>` ou nos seus ancestrais são copiados para ele ao abrir.
 *
 * ```html
 * <evo-drawer [(open)]="aAbrir" heading="Comandos" position="right" size="lg">
 *   <p>conteúdo</p>
 *   <div slot="footer">
 *     <button evoButton variant="ghost" (click)="aAbrir.set(false)">Fechar</button>
 *     <button evoButton>Enviar</button>
 *   </div>
 * </evo-drawer>
 * ```
 *
 * Para abrir por código (alertas, componentes com dados), ver
 * `EvoDrawerService`. Documentação completa no README.md desta pasta.
 */
@Component({
  selector: 'evo-drawer',
  imports: [EvoDrawerPanel],
  template: `
    <ng-template #conteudo>
      <evo-drawer-panel
        [heading]="heading()"
        [description]="description()"
        [position]="position()"
        [size]="size()"
        [showClose]="showClose()"
        [titleId]="titleId"
        [descriptionId]="description() ? descriptionId : ''"
        (dismiss)="pedirFecho('close-button')"
      >
        <ng-content select="[slot=header]" ngProjectAs="[slot=header]" />
        <ng-content select="[slot=footer]" ngProjectAs="[slot=footer]" />
        <ng-content />
      </evo-drawer-panel>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-drawer',
    // O host não desenha nada no sítio onde é declarado; existe para receber
    // [evoTokens] e para o ciclo de vida.
    style: 'display: contents',
    '[attr.data-evo-open]': 'open() ? "" : null',
  },
})
export class EvoDrawer {
  /** Aberto ou fechado. Suporta `[(open)]`. */
  readonly open = model(false);
  /** Título visível; também `slot="header"`. */
  readonly heading = input('');
  /** Linha secundária do cabeçalho. */
  readonly description = input('');
  /** Nome acessível quando não há título visível. */
  readonly ariaLabel = input('');
  readonly position = input<EvoDrawerPosition>('right');
  readonly size = input<EvoDrawerSize>('md');
  /** Mostra o fundo escurecido. */
  readonly backdrop = input(true, { transform: booleanAttribute });
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly showClose = input(true, { transform: booleanAttribute });
  /** Guarda para Escape, fundo e ×. Devolver `false` mantém o drawer aberto. */
  readonly beforeClose = input<EvoDrawerBeforeCloseFn | null>(null);

  /** Depois de fechar, com o motivo. */
  readonly closed = output<EvoDrawerCloseReason>();

  protected readonly titleId = `evo-drawer-${proximoId++}-title`;
  protected readonly descriptionId = `evo-drawer-${proximoId}-description`;

  private readonly conteudo = viewChild.required<TemplateRef<unknown>>('conteudo');
  private readonly dialog = inject(Dialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly vcr = inject(ViewContainerRef);
  private overlay: EvoDrawerOverlay<void> | null = null;

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (this.heading() || this.ariaLabel()) return;
        console.warn(
          '[evo-drawer] Sem `heading` nem `ariaLabel`: o painel fica sem nome acessível.',
        );
      });
    }

    // No servidor não há overlay: o drawer só existe no browser.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    // Um efeito para comandar o CDK (efeito colateral), não para sincronizar
    // signals. Depois do render, para o <ng-template> já existir.
    afterRenderEffect(() => {
      const aberto = this.open();
      untracked(() => {
        if (aberto && !this.overlay) this.abrir();
        else if (!aberto) this.overlay?.fechar(undefined, 'programmatic');
      });
    });

    inject(DestroyRef).onDestroy(() => this.overlay?.fechar(undefined, 'programmatic'));
  }

  protected pedirFecho(reason: EvoDrawerCloseReason): void {
    void this.overlay?.pedirFecho(reason);
  }

  private abrir(): void {
    // Getters: o fundo e a guarda são lidos no momento do clique, não ao abrir.
    const eu = this;
    const base: EvoDrawerBaseConfig = {
      ariaLabel: this.ariaLabel(),
      position: this.position(),
      size: this.size(),
      get backdrop() {
        return eu.backdrop();
      },
      get closeOnBackdrop() {
        return eu.closeOnBackdrop();
      },
      get closeOnEscape() {
        return eu.closeOnEscape();
      },
      get beforeClose() {
        return eu.beforeClose() ?? undefined;
      },
    };

    this.overlay = abrirEvoDrawer<void>(this.dialog, this.conteudo(), {
      base,
      dialog: {
        viewContainerRef: this.vcr,
        ariaLabelledBy: this.ariaLabel() ? null : this.titleId,
        ariaDescribedBy: this.ariaLabel() || !this.description() ? null : this.descriptionId,
      },
      tokens: tokensEmLinha(this.host),
      aoFechar: (_, reason) => {
        this.overlay = null;
        if (this.open()) this.open.set(false);
        this.closed.emit(reason);
      },
    });
  }
}
