import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Contexto dos templates de célula, de acções e de detalhe. */
export interface EvoDataTableRowContext<T> {
  /** A linha. `let-row` */
  readonly $implicit: T;
  /** A mesma linha, para `let-item="item"` (forma do original). */
  readonly item: T;
  /** Posição na lista completa (não na página), a começar em 0. */
  readonly index: number;
}

/**
 * Template de uma coluna. Substitui o texto da célula; o `<td>` continua a
 * cargo da tabela.
 *
 * ```html
 * <ng-template evoCell="estado" [evoCellOf]="facturas()" let-f>
 *   <evo-badge [tone]="f.pago ? 'success' : 'warning'">{{ f.estado }}</evo-badge>
 * </ng-template>
 * ```
 *
 * `[evoCellOf]` é opcional: só serve para o editor inferir o tipo de `f`.
 */
@Directive({ selector: 'ng-template[evoCell]' })
export class EvoDataTableCell<T = unknown> {
  /** A `key` da coluna. */
  readonly evoCell = input.required<string>();
  readonly evoCellOf = input<readonly T[] | null | undefined>(undefined);
  readonly template = inject<TemplateRef<EvoDataTableRowContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: EvoDataTableCell<T>,
    ctx: unknown,
  ): ctx is EvoDataTableRowContext<T> {
    return true;
  }
}

/**
 * Coluna de acções, sempre a última. Põe sempre aqui um botão para o que o
 * clique na linha faz: o clique na linha é uma conveniência, não o único caminho.
 *
 * ```html
 * <ng-template evoRowActions let-f>
 *   <button evoButton variant="ghost" size="sm" (click)="editar(f)">Editar</button>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[evoRowActions]' })
export class EvoDataTableRowActions<T = unknown> {
  readonly evoRowActionsOf = input<readonly T[] | null | undefined>(undefined);
  readonly template = inject<TemplateRef<EvoDataTableRowContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: EvoDataTableRowActions<T>,
    ctx: unknown,
  ): ctx is EvoDataTableRowContext<T> {
    return true;
  }
}

/**
 * Detalhe de uma linha, mostrado por baixo dela ao expandir. A presença deste
 * template acrescenta a coluna com o botão de expandir.
 *
 * ```html
 * <ng-template evoRowDetail let-f>
 *   <dl>…</dl>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[evoRowDetail]' })
export class EvoDataTableRowDetail<T = unknown> {
  readonly evoRowDetailOf = input<readonly T[] | null | undefined>(undefined);
  readonly template = inject<TemplateRef<EvoDataTableRowContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: EvoDataTableRowDetail<T>,
    ctx: unknown,
  ): ctx is EvoDataTableRowContext<T> {
    return true;
  }
}
