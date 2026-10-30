import { FocusableOption } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { EvoTabs } from './evo-tabs';

/**
 * Uma tab. Aplica-se a um `<button>` nativo, dentro de `<evo-tab-list>`.
 *
 * ```html
 * <button evoTab value="geral">Geral</button>
 * <button evoTab value="avancado" disabled>Avançado</button>
 * ```
 *
 * `disabled` tira a tab da navegação por setas e do foco (nativo, `<button disabled>`).
 * **Diferente do Joy UI**: lá, medido, uma tab desactivada continua alcançável
 * pelas setas (só não activa ao Enter/Espaço) — aqui é saltada, como no `EvoMenu`.
 */
@Component({
  selector: 'button[evoTab]',
  template: `<ng-content />`,
  styleUrl: './tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-tab',
    role: 'tab',
    type: 'button',
    '[id]': 'elId()',
    '[attr.aria-selected]': 'seleccionada()',
    '[attr.aria-controls]': 'idPainel()',
    '[attr.tabindex]': 'active() ? 0 : -1',
    '[attr.data-evo-orientation]': 'ctx.orientation()',
    '[disabled]': 'desactivada()',
    '[attr.data-evo-selected]': 'seleccionada() ? "" : null',
  },
})
export class EvoTab implements FocusableOption {
  readonly value = input.required<string | number>();
  readonly desactivada = input(false, { alias: 'disabled', transform: booleanAttribute });

  protected readonly ctx = inject(EvoTabs);
  /**
   * Público (como em `EvoSelectItem`): o `EvoTabList` precisa dele para saber,
   * num clique, a QUAL tab pertence o elemento clicado (`closest('.evo-tab')`).
   */
  readonly elemento = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;

  protected readonly elId = computed(() => `${this.ctx.id}-tab-${this.value()}`);
  protected readonly idPainel = computed(() => `${this.ctx.id}-panel-${this.value()}`);
  protected readonly seleccionada = computed(() => this.ctx.value() === this.value());

  /**
   * `tabindex` próprio (roving tabindex): quem o mantém sincronizado com o item
   * activo do `FocusKeyManager` é o `EvoTabList` pai.
   */
  readonly active = signal(false);

  /** Propriedade simples (não signal) — é o que o `ListKeyManager` do CDK lê para saltar itens. */
  get disabled(): boolean {
    return this.desactivada();
  }

  focus(): void {
    this.elemento.focus();
  }
}
