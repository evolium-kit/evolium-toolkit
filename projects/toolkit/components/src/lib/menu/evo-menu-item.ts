import { CDK_MENU, CdkMenuGroup, CdkMenuItem, Menu } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EvoMenuBar } from './evo-menu-bar';

/** Contador de módulo (não `crypto`): os ids têm de coincidir entre servidor e cliente. */
let proximoId = 0;

/**
 * O que os itens têm em comum: o `CdkMenuItem` (teclado, foco, typeahead, fecho
 * do menu ao activar) e o `closeOnSelect`.
 *
 * `disabled` mantém o item **focável** com `aria-disabled` (como o `CdkMenuItem`
 * e o padrão ARIA): um leitor de ecrã encontra-o e sabe que está desactivado.
 */
@Directive({ host: { '(mouseenter)': 'aoPassarRato()' } })
export abstract class EvoMenuItemBase {
  /**
   * Fecha o menu depois de activar o item. Com `false` o menu fica aberto — útil
   * em caixas de verificação, para marcar várias seguidas.
   */
  readonly closeOnSelect = input(true, { transform: booleanAttribute });

  protected readonly cdk = inject(CdkMenuItem, { self: true });
  private readonly menu = inject(CDK_MENU, { optional: true }) as
    (Menu & { setActiveMenuItem?(item: CdkMenuItem): void }) | null;

  /**
   * O rato por cima de um item passa-lhe o foco, como no Joy: assim há um só item
   * destacado, mesmo depois de ter usado o teclado, e as setas continuam a partir dele.
   * O `CdkMenu` não o faz sozinho.
   */
  protected aoPassarRato(): void {
    this.menu?.setActiveMenuItem?.(this.cdk);
  }

  constructor() {
    // O `CdkMenuItem` decide fechar dentro de `trigger()`, que o clique, o Enter
    // e o Espaço chamam: é o único ponto por onde o `closeOnSelect` passa.
    const original = this.cdk.trigger.bind(this.cdk);
    this.cdk.trigger = (opcoes) =>
      original(this.closeOnSelect() ? opcoes : { ...opcoes, keepOpen: true });
  }
}

const ITEM_TEMPLATE = `
  <ng-content select="[slot='prefix']" />
  <span class="evo-menu-item__label"><ng-content /></span>
  <ng-content select="[slot='suffix']" />
`;

const ITEM_HOST_INPUTS = [
  'cdkMenuItemDisabled: disabled',
  'cdkMenuitemTypeaheadLabel: typeaheadLabel',
];

/**
 * Item de acção do menu. Aplica-se a um `<button>` ou `<a>` nativo.
 *
 * ```html
 * <button evoMenuItem (activated)="editar()">Editar</button>
 * <a evoMenuItem routerLink="/perfil">O meu perfil</a>
 * <button evoMenuItem disabled>Indisponível</button>
 * <button evoMenuItem selected>Estás aqui</button>
 * <button evoMenuItem (activated)="sair()">
 *   <svg slot="prefix" aria-hidden="true">…</svg>
 *   Terminar sessão
 *   <kbd slot="suffix">⌘ Q</kbd>
 * </button>
 * ```
 *
 * Com `[evoMenuTriggerFor]` no mesmo elemento, é um submenu.
 */
@Component({
  selector: 'button[evoMenuItem], a[evoMenuItem]',
  template: ITEM_TEMPLATE,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ITEM_HOST_INPUTS,
      outputs: ['cdkMenuItemTriggered: activated'],
    },
  ],
  host: {
    class: 'evo-menu-item',
    // Um `disabled` estático não pode desactivar o botão nativo: tiraria-o do foco.
    '[attr.disabled]': 'null',
    '[attr.data-evo-selected]': 'selected() ? "" : null',
    '[attr.aria-current]': 'selected() ? "true" : null',
    '[attr.data-evo-in-bar]': 'naBarra ? "" : null',
  },
})
export class EvoMenuItem extends EvoMenuItemBase {
  /** Numa `evo-menu-bar` o item tem a largura do conteúdo e a seta para baixo. */
  protected readonly naBarra = !!inject(EvoMenuBar, { optional: true });

  /** O item que corresponde ao sítio onde estás (`aria-current`), como o `selected` do Joy. */
  readonly selected = input(false, { transform: booleanAttribute });
}

/**
 * Item com caixa de verificação. O estado é teu: `[(checked)]`.
 *
 * ```html
 * <button evoMenuCheckbox [(checked)]="mostrarGrelha" [closeOnSelect]="false">Grelha</button>
 * ```
 *
 * No CDK o Espaço nunca fecha um item marcável, e o Enter e o clique fecham
 * (a não ser que `closeOnSelect` seja `false`).
 */
@Component({
  selector: 'button[evoMenuCheckbox]',
  template: ITEM_TEMPLATE,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ITEM_HOST_INPUTS,
      outputs: ['cdkMenuItemTriggered: activated'],
    },
  ],
  host: {
    class: 'evo-menu-item',
    role: 'menuitemcheckbox',
    '[attr.disabled]': 'null',
    '[attr.aria-checked]': 'checked()',
    '[attr.data-evo-checked]': 'checked() ? "" : null',
  },
})
export class EvoMenuCheckbox extends EvoMenuItemBase {
  readonly checked = model(false);

  constructor() {
    super();
    this.cdk['closeOnSpacebarTrigger'] = false;
    this.cdk.triggered.pipe(takeUntilDestroyed()).subscribe(() => this.checked.update((v) => !v));
  }
}

/**
 * Grupo de itens, com cabeçalho opcional. Com itens `evoMenuRadio` é um grupo de
 * escolha única, cujo valor é `[(value)]`.
 *
 * ```html
 * <evo-menu-group label="Tamanho" [(value)]="tamanho">
 *   <button evoMenuRadio value="sm">Pequeno</button>
 *   <button evoMenuRadio value="md">Médio</button>
 * </evo-menu-group>
 * ```
 */
@Component({
  selector: 'evo-menu-group',
  template: `
    @if (label()) {
      <span class="evo-menu-group__label" [id]="idRotulo" aria-hidden="true">{{ label() }}</span>
    }
    <ng-content />
  `,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [CdkMenuGroup],
  host: {
    class: 'evo-menu-group',
    role: 'group',
    '[attr.aria-labelledby]': 'label() ? idRotulo : null',
  },
})
export class EvoMenuGroup {
  /** Cabeçalho do grupo; também o nome acessível. */
  readonly label = input('');
  /** O `value` do item `evoMenuRadio` escolhido. */
  readonly value = model<unknown>(undefined);

  protected readonly idRotulo = `evo-menu-group-${proximoId++}`;
}

/** Item de escolha única: dentro de um `evo-menu-group`, só um fica marcado. */
@Component({
  selector: 'button[evoMenuRadio]',
  template: ITEM_TEMPLATE,
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ITEM_HOST_INPUTS,
      outputs: ['cdkMenuItemTriggered: activated'],
    },
  ],
  host: {
    class: 'evo-menu-item',
    role: 'menuitemradio',
    '[attr.disabled]': 'null',
    '[attr.aria-checked]': 'checked()',
    '[attr.data-evo-checked]': 'checked() ? "" : null',
  },
})
export class EvoMenuRadio extends EvoMenuItemBase {
  /** O valor deste item; compara-se com o `value` do grupo por `===`. */
  readonly value = input<unknown>();

  private readonly grupo = inject(EvoMenuGroup, { optional: true });

  protected readonly checked = computed(() => !!this.grupo && this.grupo.value() === this.value());

  constructor() {
    super();
    this.cdk['closeOnSpacebarTrigger'] = false;
    this.cdk.triggered
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.grupo?.value.set(this.value()));
  }
}

/** Linha que separa grupos de itens. */
@Component({
  selector: 'hr[evoMenuSeparator], div[evoMenuSeparator]',
  template: '',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-menu-separator', role: 'separator' },
})
export class EvoMenuSeparator {}
