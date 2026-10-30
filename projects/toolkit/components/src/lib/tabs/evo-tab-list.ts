import { FocusKeyManager } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  untracked,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EvoTab } from './evo-tab';
import { EvoTabs } from './evo-tabs';
import type { EvoTabEntry } from './tabs.types';

/**
 * Contentor das tabs (`role="tablist"`). Roving tabindex por `FocusKeyManager`
 * do CDK: setas movem o foco (wrap nas pontas), Home/End vão às extremidades,
 * tabs desactivadas são saltadas — tudo de graça pelo `skipPredicate` por
 * omissão do CDK (lê o `disabled` do `EvoTab`).
 *
 * ```html
 * <evo-tab-list>
 *   <button evoTab value="a">A</button>
 *   <button evoTab value="b">B</button>
 * </evo-tab-list>
 *
 * <!-- ou por dados — só os botões; os painéis continuam compostos à mão -->
 * <evo-tab-list [tabs]="entradas()" />
 * ```
 */
@Component({
  selector: 'evo-tab-list',
  imports: [EvoTab],
  template: `
    <ng-content />
    @for (t of tabs() ?? []; track t.value) {
      <button evoTab [value]="t.value" [disabled]="!!t.disabled">{{ t.label }}</button>
    }
  `,
  styleUrl: './tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-tab-list',
    role: 'tablist',
    '[attr.aria-label]': 'ctx.ariaLabel() || null',
    '[attr.aria-labelledby]': 'ctx.ariaLabelledby() || null',
    '[attr.aria-orientation]': 'ctx.orientation()',
    '[attr.data-evo-orientation]': 'ctx.orientation()',
    '[attr.data-evo-size]': 'ctx.size()',
    '[attr.data-evo-sticky]': 'sticky()',
    '[attr.data-evo-disable-underline]': 'disableUnderline() ? "" : null',
    '[attr.data-evo-scrollable]': 'scrollable() ? "" : null',
    '(keydown)': 'aoTeclar($event)',
    '(click)': 'aoClicar($event)',
  },
})
export class EvoTabList {
  /** Tabs por dados: gera só os botões (sem precisar de os compor um a um). */
  readonly tabs = input<readonly EvoTabEntry[] | null>(null);
  /** Esconde a linha completa por baixo de toda a lista. */
  readonly disableUnderline = input(false, { transform: booleanAttribute });
  /** Fixa a lista no topo ou no fundo do contentor com scroll. */
  readonly sticky = input<'top' | 'bottom' | null>(null);
  /** Lista com scroll horizontal/vertical (muitas tabs), sem CSS à parte. */
  readonly scrollable = input(false, { transform: booleanAttribute });

  protected readonly ctx = inject(EvoTabs);
  private readonly injector = inject(Injector);

  /** Compostas pelo utilizador (`<ng-content>`) + geradas por `[tabs]` (no próprio template). */
  private readonly projectadas = contentChildren(EvoTab, { descendants: true });
  private readonly geradas = viewChildren(EvoTab);
  private readonly itens = computed(() => [...this.projectadas(), ...this.geradas()]);

  private readonly teclas = new FocusKeyManager(this.itens, this.injector)
    .withWrap()
    .withHomeAndEnd();

  constructor() {
    // Só um eixo responde de cada vez — medido assim na referência (Joy UI):
    // tabs verticais ignoram ←/→, horizontais ignoram ↑/↓.
    effect(() => {
      if (this.ctx.orientation() === 'vertical') {
        this.teclas.withVerticalOrientation(true).withHorizontalOrientation(null);
      } else {
        this.teclas.withHorizontalOrientation('ltr').withVerticalOrientation(false);
      }
    });

    // Mantém o item activo (roving tabindex) alinhado com o valor seleccionado:
    // no arranque, depois de um clique (que só muda `ctx.value`) e em qualquer
    // mudança programática. Sem tab seleccionada, a 1.ª fica focável na mesma.
    //
    // Só `ctx.value()` é dependência rastreada: `itens()` lê-se em `untracked()`
    // porque os sinais de `contentChildren`/`viewChildren` podem mudar de
    // referência a cada verificação sem a lista ter mudado de verdade — sem
    // isto, este efeito corria a cada `detectChanges()` e desfazia a navegação
    // por teclado (que não toca em `ctx.value`), repondo sempre a tab activa.
    effect(() => {
      const valorActual = this.ctx.value();
      untracked(() => {
        const lista = this.itens();
        // Um `EvoTab` recém-criado (ex.: por `[tabs]`) pode ainda não ter o
        // `value.required()` disponível neste ciclo — NG0950. Ignora-o nesta
        // volta; o efeito corre de novo assim que o `value` estabilizar.
        const lerValor = (t: EvoTab) => {
          try {
            return t.value();
          } catch {
            return undefined;
          }
        };
        const alvo = lista.find((t) => lerValor(t) === valorActual) ?? lista[0];
        if (alvo) this.teclas.updateActiveItem(alvo);
        this.sincronizarActivo();
      });
    });

    this.teclas.change.pipe(takeUntilDestroyed()).subscribe(() => {
      this.sincronizarActivo();
      const activo = this.teclas.activeItem;
      if (activo && this.ctx.selectionFollowsFocus()) this.ctx.value.set(activo.value());
    });
  }

  private sincronizarActivo(): void {
    const activo = this.teclas.activeItem;
    for (const t of this.itens()) t.active.set(t === activo);
  }

  /**
   * O clique também vai pelo `FocusKeyManager` (`setActiveItem`, síncrono), e não
   * só pelo efeito que observa `ctx.value()`: esse efeito é assíncrono (corre
   * depois do `click`), e uma seta premida logo a seguir ao clique apanhava o
   * `teclas` ainda por sincronizar — a 1.ª tecla parecia não fazer nada.
   */
  protected aoClicar(evento: MouseEvent): void {
    const alvo = (evento.target as HTMLElement).closest<HTMLElement>('.evo-tab');
    if (!alvo) return;
    const tab = this.itens().find((t) => t.elemento === alvo);
    if (!tab || tab.disabled) return;
    this.teclas.setActiveItem(tab);
    this.ctx.value.set(tab.value());
  }

  protected aoTeclar(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' || evento.key === ' ') {
      const activo = this.teclas.activeItem;
      if (activo && !activo.disabled) this.ctx.value.set(activo.value());
      evento.preventDefault();
      return;
    }
    // Setas, Home e End: o CDK lê `event.keyCode` (não só `key`) para os despachar.
    this.teclas.onKeydown(evento);
  }
}
