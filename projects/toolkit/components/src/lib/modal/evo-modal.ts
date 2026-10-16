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
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EvoModalPanel } from './evo-modal-panel';
import { EvoModalOverlay, abrirEvoModal, tokensEmLinha } from './modal-overlay';
import {
  EvoModalBaseConfig,
  EvoModalBeforeCloseFn,
  EvoModalCloseReason,
  EvoModalPosition,
  EvoModalSize,
  EvoModalTone,
} from './modal.types';

/**
 * Contador de módulo, e não `crypto.randomUUID()`: não depende de APIs do
 * browser e corre igual no servidor.
 */
let proximoId = 0;

/**
 * Modal declarativo, aberto e fechado por `[(open)]`.
 *
 * Assenta no `Dialog` do `@angular/cdk`: focus trap, Escape, bloqueio do
 * scroll da página, devolução do foco a quem abriu e `aria-modal` vêm de lá.
 * O conteúdo é desenhado no fim do `<body>`; os `[evoTokens]` postos no
 * `<evo-modal>` ou nos seus ancestrais são copiados para ele ao abrir.
 *
 * ```html
 * <evo-modal [(open)]="aEditar" heading="Editar empresa" size="lg">
 *   <form id="f-empresa" [formGroup]="form" (ngSubmit)="gravar()">…</form>
 *   <div slot="footer">
 *     <button evoButton variant="ghost" (click)="aEditar.set(false)">Cancelar</button>
 *     <button evoButton type="submit" form="f-empresa">Gravar</button>
 *   </div>
 * </evo-modal>
 * ```
 *
 * Para alertas, confirmações ou modais com um componente, ver
 * `EvoModalService`. Documentação completa no README.md desta pasta.
 */
@Component({
  selector: 'evo-modal',
  imports: [EvoModalPanel],
  template: `
    <ng-template #conteudo>
      <evo-modal-panel
        [heading]="heading()"
        [tone]="tone()"
        [size]="size()"
        [showClose]="showClose()"
        [titleId]="titleId"
        (dismiss)="pedirFecho('close-button')"
      >
        <ng-content select="[slot=icon]" ngProjectAs="[slot=icon]" />
        <ng-content select="[slot=title]" ngProjectAs="[slot=title]" />
        <ng-content select="[slot=footer]" ngProjectAs="[slot=footer]" />
        <ng-content />
      </evo-modal-panel>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-modal',
    // O host não desenha nada no sítio onde é declarado; existe para receber
    // [evoTokens] e para o ciclo de vida.
    style: 'display: contents',
    '[attr.data-evo-open]': 'open() ? "" : null',
  },
})
export class EvoModal {
  /** Aberto ou fechado. Suporta `[(open)]`. */
  readonly open = model(false);
  /** Título visível; também `slot="title"`. */
  readonly heading = input('');
  /** Nome acessível quando não há título visível. */
  readonly ariaLabel = input('');
  readonly size = input<EvoModalSize>('md');
  readonly position = input<EvoModalPosition>('center');
  /** Ícone e cor por tom. Um `slot="icon"` substitui o ícone e mantém a cor. */
  readonly tone = input<EvoModalTone | null>(null);
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  readonly showClose = input(true, { transform: booleanAttribute });
  /** Guarda para Escape, fundo e ×. Devolver `false` mantém o modal aberto. */
  readonly beforeClose = input<EvoModalBeforeCloseFn | null>(null);

  /** Depois de fechar, com o motivo. */
  readonly closed = output<EvoModalCloseReason>();

  protected readonly titleId = `evo-modal-${proximoId++}-title`;

  private readonly conteudo = viewChild.required<TemplateRef<unknown>>('conteudo');
  private readonly dialog = inject(Dialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly vcr = inject(ViewContainerRef);
  private overlay: EvoModalOverlay<void> | null = null;

  constructor() {
    // No servidor não há overlay: o modal só existe no browser.
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

  protected pedirFecho(reason: EvoModalCloseReason): void {
    void this.overlay?.pedirFecho(reason);
  }

  private abrir(): void {
    // Getters: o fundo e a guarda são lidos no momento do clique, não ao abrir.
    const eu = this;
    const base: EvoModalBaseConfig = {
      ariaLabel: this.ariaLabel(),
      size: this.size(),
      position: this.position(),
      get closeOnBackdrop() {
        return eu.closeOnBackdrop();
      },
      get beforeClose() {
        return eu.beforeClose() ?? undefined;
      },
    };

    this.overlay = abrirEvoModal<void>(this.dialog, this.conteudo(), {
      base,
      dialog: {
        viewContainerRef: this.vcr,
        ariaLabelledBy: this.ariaLabel() ? null : this.titleId,
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
