import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Uma opção do `EvoSelect`. */
export interface EvoSelectOption<V = unknown, D = unknown> {
  /** Valor entregue ao formulário. Qualquer tipo: comparado por `compareWith`. */
  readonly value: V;
  readonly label: string;
  /** Segunda linha, mais discreta (ex.: o NIF por baixo do nome). */
  readonly sublabel?: string;
  /**
   * Ícone à esquerda. Um URL ou caminho de imagem (`https://`, `/`, `./`,
   * `data:image`, ou terminado em `.png`, `.svg`, …) dá um `<img>`; qualquer
   * outro texto dá um `<span>` com esse texto — para fontes de ícones por
   * ligadura, passar a classe da fonte em `iconClass` (ex.: `'material-icons'`).
   */
  readonly icon?: string;
  /** Classe(s) acrescentada(s) ao ícone. */
  readonly iconClass?: string;
  /** Opções com o mesmo `group` são agrupadas sob um cabeçalho. */
  readonly group?: string;
  /** Visível, mas não seleccionável. */
  readonly disabled?: boolean;
  /** Dados livres, para templates personalizados. */
  readonly data?: D;
}

/** Contexto de um `<ng-template evoSelectOption>`. */
export interface EvoSelectOptionContext<V = unknown, D = unknown> {
  readonly $implicit: EvoSelectOption<V, D>;
  readonly selected: boolean;
}

/**
 * Template personalizado para cada opção. Substitui todo o conteúdo da opção
 * (ícone, texto e visto); a semântica (`role="option"`, `aria-selected`)
 * continua a cargo do `evo-select`.
 *
 * ```html
 * <evo-select [options]="empresas" formControlName="empresa">
 *   <ng-template [evoSelectOption]="empresas" let-opcao let-seleccionada="selected">
 *     <img [src]="opcao.icon" alt="" /> {{ opcao.label }}
 *   </ng-template>
 * </evo-select>
 * ```
 *
 * Passar as opções a `[evoSelectOption]` é opcional: só serve para o editor
 * inferir o tipo de `opcao`. `<ng-template evoSelectOption let-opcao>` também
 * funciona.
 */
@Directive({ selector: 'ng-template[evoSelectOption]' })
export class EvoSelectOptionDef<V = unknown, D = unknown> {
  readonly evoSelectOption = input<readonly EvoSelectOption<V, D>[] | ''>('');
  readonly template = inject<TemplateRef<EvoSelectOptionContext<V, D>>>(TemplateRef);

  static ngTemplateContextGuard<V, D>(
    _dir: EvoSelectOptionDef<V, D>,
    ctx: unknown,
  ): ctx is EvoSelectOptionContext<V, D> {
    return true;
  }
}

/** Filtro de pesquisa: devolve `true` para manter a opção. */
export type EvoSelectSearchFn = (opcao: EvoSelectOption, termo: string) => boolean;

/** Minúsculas e sem acentos: "Ângola" e "angola" são o mesmo termo. */
export function evoNormalizeSearch(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** Pesquisa por omissão: no `label` e no `sublabel`, sem distinguir acentos. */
export const evoSelectDefaultSearch: EvoSelectSearchFn = (opcao, termo) => {
  const t = evoNormalizeSearch(termo);
  return (
    evoNormalizeSearch(opcao.label).includes(t) ||
    (!!opcao.sublabel && evoNormalizeSearch(opcao.sublabel).includes(t))
  );
};
