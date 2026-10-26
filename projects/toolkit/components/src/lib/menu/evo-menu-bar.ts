import { CdkMenuBar } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Barra de menus de aplicação (Ficheiro, Editar, Ver…). Cada entrada é um
 * `button[evoMenuItem]` com `[evoMenuTriggerFor]`.
 *
 * ```html
 * <evo-menu-bar aria-label="Menu da aplicação">
 *   <button evoMenuItem [evoMenuTriggerFor]="ficheiro">Ficheiro</button>
 *   <button evoMenuItem [evoMenuTriggerFor]="editar">Editar</button>
 * </evo-menu-bar>
 * ```
 *
 * Com a barra fechada, ←/→ passam de uma entrada à outra; com um menu aberto,
 * ←/→ e o rato por cima de outra entrada trocam de menu. (O Joy só troca de
 * menu com o menu aberto.) O `role="menubar"` fica sem nome se não levar
 * `aria-label` ou `aria-labelledby`.
 */
@Component({
  selector: 'evo-menu-bar',
  template: `<ng-content />`,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [CdkMenuBar],
  host: { class: 'evo-menu-bar' },
})
export class EvoMenuBar {}
