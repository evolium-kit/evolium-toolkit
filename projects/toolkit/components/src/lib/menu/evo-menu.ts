import { CdkMenu, CdkTargetMenuAim } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { tokensEmLinha } from '../modal/modal-overlay';
import { EVO_MENU_TRIGGER, EvoMenuSize } from './menu.types';

/** Os painéis (`.cdk-overlay-pane`) que já têm o ouvinte do Escape. */
const painesComEscape = new WeakSet<Element>();

/**
 * O Escape que fecha o menu não pode chegar ao `Dialog` por baixo: o despachante
 * de teclado dos overlays do CDK entregá-lo-ia também a ele, e um menu dentro de
 * um modal ou drawer fecharia os dois de uma vez.
 */
function pararEscape(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') evento.stopPropagation();
}

/**
 * Painel do menu: a lista de itens.
 *
 * Vive **dentro de um `<ng-template>`**, que o gatilho (`[evoMenuTriggerFor]`)
 * desenha num overlay ao abrir. Os itens têm de ser declarados como filhos
 * directos deste elemento — é como o `CdkMenu` os encontra (por query e por
 * injecção), e não funciona se vierem de outro template.
 *
 * ```html
 * <button evoButton [evoMenuTriggerFor]="acoes">Acções</button>
 * <ng-template #acoes>
 *   <evo-menu>
 *     <button evoMenuItem (activated)="editar()">Editar</button>
 *     <hr evoMenuSeparator />
 *     <button evoMenuItem (activated)="apagar()">Eliminar</button>
 *   </evo-menu>
 * </ng-template>
 * ```
 *
 * Fora de qualquer gatilho, é um menu **embutido** na página (ex.: um menu
 * lateral), com o mesmo teclado. O teclado, o typeahead, os submenus e a
 * devolução do foco ao gatilho são do `CdkMenu`.
 */
@Component({
  selector: 'evo-menu',
  template: `<ng-content />`,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O `id` é do `CdkMenu` (que o liga ao host): sem o expor, um `id` posto no
  // `<evo-menu>` seria substituído pelo gerado.
  hostDirectives: [{ directive: CdkMenu, inputs: ['id'] }, CdkTargetMenuAim],
  host: {
    class: 'evo-menu',
    '[attr.data-evo-size]': 'tamanho()',
    // O painel é nomeado pelo gatilho que o abriu: o Joy deixa-o sem nome.
    '[attr.aria-labelledby]': 'gatilho?.id ?? null',
  },
})
export class EvoMenu {
  /**
   * Tamanho. Um submenu herda o do menu que o abriu; um menu sozinho é `md`.
   */
  readonly size = input<EvoMenuSize | null>(null);

  protected readonly gatilho = inject(EVO_MENU_TRIGGER, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** O tamanho em vigor: o pedido, senão o do menu pai, senão `md`. */
  readonly tamanho = computed(() => this.size() ?? this.gatilho?.size?.() ?? 'md');

  constructor() {
    afterNextRender(() => {
      if (!this.gatilho) return;

      // O Escape fecha o painel e o `CdkMenu` destrói-o nesse mesmo instante, com
      // os ouvintes dele: por isso o ouvinte vive no `.cdk-overlay-pane`, que
      // sobrevive entre aberturas.
      const painel = this.host.parentElement;
      if (painel && !painesComEscape.has(painel)) {
        painesComEscape.add(painel);
        painel.addEventListener('keydown', pararEscape);
      }

      // O painel é desenhado no fim do <body>, fora da árvore do gatilho: sem isto
      // um `[evoTokens]` num ancestral do gatilho não lhe chegaria. Cada abertura
      // cria o painel de novo, por isso lê os valores actuais.
      const tokens = tokensEmLinha(this.gatilho.element);
      for (const [nome, valor] of Object.entries(tokens)) {
        this.host.style.setProperty(nome, valor);
      }
    });
  }
}
