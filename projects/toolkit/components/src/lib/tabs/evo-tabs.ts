import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';
import { EvoSize } from '../component-types';

let proximoId = 0;

/**
 * Contexto partilhado por `<evo-tab-list>`, `evoTab` e `<evo-tab-panel>`.
 *
 * ```html
 * <evo-tabs [(value)]="separador" ariaLabel="Definições">
 *   <evo-tab-list>
 *     <button evoTab value="geral">Geral</button>
 *     <button evoTab value="facturacao">Facturação</button>
 *   </evo-tab-list>
 *   <evo-tab-panel value="geral">…</evo-tab-panel>
 *   <evo-tab-panel value="facturacao">…</evo-tab-panel>
 * </evo-tabs>
 * ```
 *
 * Por omissão a selecção é manual: as setas só movem o foco (teclado por
 * `FocusKeyManager` do CDK), Enter/Espaço selecciona. Com
 * `selectionFollowsFocus`, o foco já selecciona — como no Joy UI.
 *
 * Aparência por tokens `--evo-tabs-*`. Ver README.md desta pasta.
 */
@Component({
  selector: 'evo-tabs',
  template: `<ng-content />`,
  styleUrl: './tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-tabs',
    '[attr.data-evo-orientation]': 'orientation()',
  },
})
export class EvoTabs {
  /** Tab seleccionada. Suporta `[(value)]`. */
  readonly value = model<string | number | undefined>(undefined);
  /** Direcção do teclado (↔ ou ↕) e do layout. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly size = input<EvoSize>('md');
  /**
   * `true` = activação automática: o foco já selecciona a tab (setas incluídas).
   * Omissão: activação manual — as setas só movem o foco, Enter/Espaço selecciona.
   */
  readonly selectionFollowsFocus = input(false, { transform: booleanAttribute });
  /** Nome acessível do `<evo-tab-list>` (`role="tablist"`). Usar um dos dois. */
  readonly ariaLabel = input('');
  readonly ariaLabelledby = input('');

  /**
   * Usado por `evoTab`/`EvoTabPanel` para gerar ids ligados por
   * `aria-controls`/`aria-labelledby`, sem precisar de um registo central.
   */
  readonly id = `evo-tabs-${proximoId++}`;
}
