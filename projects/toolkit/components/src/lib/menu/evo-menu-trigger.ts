import { CDK_MENU, CdkContextMenuTrigger, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  SimpleChange,
  TemplateRef,
  ViewContainerRef,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EvoMenu } from './evo-menu';
import {
  EvoMenuCheckbox,
  EvoMenuGroup,
  EvoMenuItem,
  EvoMenuRadio,
  EvoMenuSeparator,
} from './evo-menu-item';
import {
  EVO_MENU_TRIGGER,
  EvoMenuAction,
  EvoMenuCheckboxEntry,
  EvoMenuEntry,
  EvoMenuGroupEntry,
  EvoMenuPlacement,
  EvoMenuRadioEntry,
  EvoMenuTriggerRef,
  evoMenuPositions,
} from './menu.types';

/** Contador de módulo (não `crypto`): os ids têm de coincidir entre servidor e cliente. */
let proximoId = 0;

/** O que o gatilho abre: o `<ng-template>` com um `<evo-menu>`, ou os dados do menu. */
export type EvoMenuTarget = TemplateRef<unknown> | readonly EvoMenuEntry[] | null | undefined;

/**
 * O que os dois gatilhos (clique e contexto) partilham: transformar o alvo num
 * `TemplateRef` para o CDK e, quando o alvo são dados, criar o componente que os
 * desenha.
 */
@Directive()
abstract class EvoMenuTriggerBase {
  protected readonly cdr = inject(ChangeDetectorRef);
  protected readonly vcr = inject(ViewContainerRef);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private entradas: ComponentRef<EvoMenuEntries> | null = null;

  /** O `TemplateRef` a entregar ao CDK para este alvo (ou `null`). */
  protected resolver(alvo: EvoMenuTarget): TemplateRef<unknown> | null {
    if (alvo == null) {
      this.largarEntradas();
      return null;
    }
    if (alvo instanceof TemplateRef) {
      this.largarEntradas();
      return alvo;
    }
    this.entradas ??= this.vcr.createComponent(EvoMenuEntries);
    this.entradas.setInput('entradas', alvo);
    // As queries só resolvem depois de uma passagem, e o `TemplateRef` tem de
    // existir antes do primeiro clique: sem ele o CDK não abre e o `aria-haspopup`
    // não aparece.
    this.entradas.changeDetectorRef.detectChanges();
    return this.entradas.instance.plantilla();
  }

  protected largarEntradas(): void {
    this.entradas?.destroy();
    this.entradas = null;
  }
}

/**
 * Abre um menu ao clicar (ou com ↓/↑/Enter/Espaço) no elemento onde está.
 *
 * ```html
 * <button evoButton [evoMenuTriggerFor]="acoes">Acções</button>
 * <ng-template #acoes>
 *   <evo-menu>…</evo-menu>
 * </ng-template>
 *
 * <!-- Ou por dados: -->
 * <button evoButton [evoMenuTriggerFor]="entradas">Acções</button>
 * ```
 *
 * Num item de menu (`button[evoMenuItem]`) abre um **submenu**; numa
 * `evo-menu-bar`, o menu de cada entrada da barra.
 */
@Directive({
  selector: '[evoMenuTriggerFor]',
  exportAs: 'evoMenuTrigger',
  hostDirectives: [CdkMenuTrigger],
  providers: [{ provide: EVO_MENU_TRIGGER, useExisting: forwardRef(() => EvoMenuTrigger) }],
})
export class EvoMenuTrigger extends EvoMenuTriggerBase implements EvoMenuTriggerRef {
  /** O `<ng-template>` com o `<evo-menu>`, ou a lista de entradas. */
  readonly evoMenuTriggerFor = input.required<EvoMenuTarget>();
  /**
   * Onde o painel se abre. Por omissão `bottom-start`; num submenu ou numa barra
   * de menus, o que o CDK escolhe (ao lado, ou por baixo).
   */
  readonly evoMenuPlacement = input<EvoMenuPlacement | null>(null);
  /** Distância (px) entre o gatilho e o painel. */
  readonly evoMenuOffset = input(4);
  /** Menu aberto. Suporta `[(evoMenuOpen)]`. */
  readonly evoMenuOpen = model(false);
  /** O menu abriu. */
  readonly evoMenuOpened = output<void>();
  /** O menu fechou (por escolha, Escape, clique fora ou `evoMenuOpen = false`). */
  readonly evoMenuClosed = output<void>();

  readonly id: string;

  private readonly cdk = inject(CdkMenuTrigger, { self: true });
  private readonly menuPai = inject(EvoMenu, { optional: true });
  private readonly emSubmenu = !!inject(CDK_MENU, { optional: true });

  readonly size = (): string | null => this.menuPai?.tamanho() ?? null;

  constructor() {
    super();
    // O painel usa este `id` como nome acessível. Se o elemento já tem um, fica o dele.
    this.id = this.element.id || `evo-menu-trigger-${proximoId++}`;
    if (!this.element.id) this.element.setAttribute('id', this.id);

    this.cdk.opened.pipe(takeUntilDestroyed()).subscribe(() => {
      this.evoMenuOpen.set(true);
      this.evoMenuOpened.emit();
    });
    this.cdk.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.evoMenuOpen.set(false);
      this.evoMenuClosed.emit();
    });

    // Excepção deliberada à regra "nunca `effect()` para sincronizar signals": isto
    // não sincroniza signals, empurra estado para um objecto imperativo do CDK
    // (`menuTemplateRef`, `menuPosition`, `open()`/`close()`).
    effect(() => {
      const alvo = this.evoMenuTriggerFor();
      const lugar = this.evoMenuPlacement();
      const desvio = this.evoMenuOffset();
      const aberto = this.evoMenuOpen();
      untracked(() => {
        this.cdk.menuTemplateRef = this.resolver(alvo);
        if (lugar || !this.emSubmenu) {
          const posicoes = evoMenuPositions(lugar ?? 'bottom-start', desvio);
          this.cdk.menuPosition = posicoes;
          // Com o painel já criado, o CDK só actualiza a posição por este caminho.
          this.cdk.ngOnChanges({ menuPosition: new SimpleChange(undefined, posicoes, false) });
        }
        this.cdr.markForCheck();
        const estaAberto = this.cdk.isOpen();
        if (aberto && !estaAberto) {
          this.cdk.open();
          // Aberto por código, o foco ficaria no sítio onde estava, fora do menu:
          // o teclado (e o Escape) não lhe chegaria. O clique e as setas já o fazem.
          this.cdk.getMenu()?.focusFirstItem('program');
        } else if (!aberto && estaAberto) {
          this.cdk.close();
        }
      });
    });
  }

  open(): void {
    this.cdk.open();
  }

  close(): void {
    this.cdk.close();
  }

  toggle(): void {
    this.cdk.toggle();
  }
}

/**
 * Abre um menu com o botão direito (ou a tecla de menu de contexto) sobre o
 * elemento onde está, junto ao ponteiro.
 *
 * ```html
 * <div [evoContextMenuTriggerFor]="acoes">Clica com o botão direito</div>
 * ```
 */
@Directive({
  selector: '[evoContextMenuTriggerFor]',
  exportAs: 'evoContextMenuTrigger',
  hostDirectives: [
    {
      directive: CdkContextMenuTrigger,
      inputs: ['cdkContextMenuDisabled: evoContextMenuDisabled'],
    },
  ],
  providers: [{ provide: EVO_MENU_TRIGGER, useExisting: forwardRef(() => EvoContextMenuTrigger) }],
})
export class EvoContextMenuTrigger extends EvoMenuTriggerBase implements EvoMenuTriggerRef {
  readonly evoContextMenuTriggerFor = input.required<EvoMenuTarget>();

  /** O alvo é uma área qualquer, sem nome: o painel fica sem `aria-labelledby`. */
  readonly id = null;

  private readonly cdk = inject(CdkContextMenuTrigger, { self: true });

  constructor() {
    super();
    effect(() => {
      const alvo = this.evoContextMenuTriggerFor();
      untracked(() => {
        this.cdk.menuTemplateRef = this.resolver(alvo);
        this.cdr.markForCheck();
      });
    });
  }
}

/**
 * Desenha um menu a partir de dados (`EvoMenuEntry[]`). Interno: o gatilho cria-o
 * quando recebe um array em vez de um template, e só usa o `TemplateRef` dele.
 *
 * Cada nível é declarado de uma vez, dentro do `<evo-menu>` — o `CdkMenu` só
 * encontra os itens assim. Um submenu é um item com `[evoMenuTriggerFor]` que, por
 * sua vez, recebe o array de filhos e cria outro destes: a recursão faz-se pelos
 * gatilhos, não por um template recursivo (que quebraria a query e a injecção).
 */
@Component({
  selector: 'evo-menu-entries',
  imports: [
    EvoMenu,
    EvoMenuItem,
    EvoMenuCheckbox,
    EvoMenuRadio,
    EvoMenuGroup,
    EvoMenuSeparator,
    EvoMenuTrigger,
  ],
  template: `
    <ng-template #plantilla>
      <evo-menu>
        @for (e of entradas(); track $index) {
          @switch (e.type) {
            @case ('separator') {
              <hr evoMenuSeparator />
            }
            @case ('checkbox') {
              <button
                evoMenuCheckbox
                [checked]="caixa(e).checked"
                [disabled]="!!caixa(e).disabled"
                [closeOnSelect]="false"
                (checkedChange)="caixa(e).run?.($event)"
              >
                {{ caixa(e).label }}
              </button>
            }
            @case ('group') {
              <evo-menu-group
                [label]="grupo(e).label ?? ''"
                [value]="grupo(e).value"
                (valueChange)="grupo(e).run?.($event)"
              >
                @for (c of grupo(e).children; track $index) {
                  @switch (c.type) {
                    @case ('separator') {
                      <hr evoMenuSeparator />
                    }
                    @case ('checkbox') {
                      <button
                        evoMenuCheckbox
                        [checked]="caixa(c).checked"
                        [disabled]="!!caixa(c).disabled"
                        [closeOnSelect]="false"
                        (checkedChange)="caixa(c).run?.($event)"
                      >
                        {{ caixa(c).label }}
                      </button>
                    }
                    @case ('radio') {
                      <button
                        evoMenuRadio
                        [value]="radio(c).value"
                        [disabled]="!!radio(c).disabled"
                      >
                        {{ radio(c).label }}
                      </button>
                    }
                    @default {
                      <button
                        evoMenuItem
                        [selected]="!!accao(c).selected"
                        [disabled]="!!accao(c).disabled"
                        (activated)="accao(c).run?.()"
                      >
                        {{ accao(c).label }}
                      </button>
                    }
                  }
                }
              </evo-menu-group>
            }
            @default {
              @if (accao(e).children; as filhos) {
                <button
                  evoMenuItem
                  [evoMenuTriggerFor]="filhos"
                  [disabled]="!!accao(e).disabled"
                  [typeaheadLabel]="accao(e).typeaheadLabel ?? accao(e).label"
                >
                  @if (accao(e).iconClass) {
                    <span slot="prefix" aria-hidden="true" [class]="accao(e).iconClass"></span>
                  }
                  {{ accao(e).label }}
                </button>
              } @else if (accao(e).href) {
                <a
                  evoMenuItem
                  [attr.href]="accao(e).href"
                  [selected]="!!accao(e).selected"
                  [disabled]="!!accao(e).disabled"
                  [typeaheadLabel]="accao(e).typeaheadLabel ?? accao(e).label"
                  (activated)="accao(e).run?.()"
                >
                  @if (accao(e).iconClass) {
                    <span slot="prefix" aria-hidden="true" [class]="accao(e).iconClass"></span>
                  }
                  {{ accao(e).label }}
                  @if (accao(e).suffix) {
                    <span slot="suffix">{{ accao(e).suffix }}</span>
                  }
                </a>
              } @else {
                <button
                  evoMenuItem
                  [selected]="!!accao(e).selected"
                  [disabled]="!!accao(e).disabled"
                  [typeaheadLabel]="accao(e).typeaheadLabel ?? accao(e).label"
                  (activated)="accao(e).run?.()"
                >
                  @if (accao(e).iconClass) {
                    <span slot="prefix" aria-hidden="true" [class]="accao(e).iconClass"></span>
                  }
                  {{ accao(e).label }}
                  @if (accao(e).suffix) {
                    <span slot="suffix">{{ accao(e).suffix }}</span>
                  }
                </button>
              }
            }
          }
        }
      </evo-menu>
    </ng-template>
  `,
  styles: ':host { display: none; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoMenuEntries {
  readonly entradas = input<readonly EvoMenuEntry[]>([]);
  readonly plantilla = viewChild.required<TemplateRef<unknown>>('plantilla');

  // O `@switch` do template não estreita a união pelo `type` opcional do item.
  protected accao(e: unknown): EvoMenuAction {
    return e as EvoMenuAction;
  }
  protected caixa(e: unknown): EvoMenuCheckboxEntry {
    return e as EvoMenuCheckboxEntry;
  }
  protected radio(e: unknown): EvoMenuRadioEntry {
    return e as EvoMenuRadioEntry;
  }
  protected grupo(e: unknown): EvoMenuGroupEntry {
    return e as EvoMenuGroupEntry;
  }
}
