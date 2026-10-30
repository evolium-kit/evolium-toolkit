import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { EvoTabs } from './evo-tabs';

/**
 * O painel de uma tab. Mostra-se quando o `value` corresponde à tab seleccionada.
 *
 * ```html
 * <evo-tab-panel value="geral">
 *   <p>Conteúdo da tab "Geral".</p>
 * </evo-tab-panel>
 * ```
 *
 * Por omissão o conteúdo é destruído ao sair da tab (`@if`), e recriado ao
 * voltar — mais leve, mas perde estado local (ex.: um formulário a meio).
 * `keepMounted` mantém-no sempre no DOM, só escondido por `hidden`.
 *
 * `tabindex="0"` está sempre presente (a APG recomenda-o para quem navega só
 * por teclado chegar ao conteúdo do painel) — o Joy UI, medido, não o põe.
 */
@Component({
  selector: 'evo-tab-panel',
  template: `
    @if (activo() || keepMounted()) {
      <ng-content />
    }
  `,
  styleUrl: './tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-tab-panel',
    role: 'tabpanel',
    tabindex: '0',
    '[id]': 'elId()',
    '[attr.aria-labelledby]': 'idTab()',
    '[attr.hidden]': 'activo() ? null : ""',
  },
})
export class EvoTabPanel {
  readonly value = input.required<string | number>();
  /** Mantém o conteúdo no DOM mesmo quando esta tab não está seleccionada. */
  readonly keepMounted = input(false, { transform: booleanAttribute });

  private readonly ctx = inject(EvoTabs);

  protected readonly elId = computed(() => `${this.ctx.id}-panel-${this.value()}`);
  protected readonly idTab = computed(() => `${this.ctx.id}-tab-${this.value()}`);
  protected readonly activo = computed(() => this.ctx.value() === this.value());
}
