import { Directive, ElementRef, booleanAttribute, inject, input, signal } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';

/**
 * Uma linha navegável do painel (opção ou "Seleccionar todos"), para o
 * `ActiveDescendantKeyManager`. Interno: não é exportado pela API pública.
 *
 * O foco nunca sai do gatilho (ou da pesquisa); a linha activa é anunciada
 * por `aria-activedescendant` e marcada com `data-evo-active`.
 */
@Directive({
  selector: '[evoSelectItem]',
  host: {
    '[attr.data-evo-active]': 'activo() ? "" : null',
  },
})
export class EvoSelectItem implements Highlightable {
  /** Índice da opção em `options`, ou `-1` para "Seleccionar todos". */
  readonly indice = input.required<number>({ alias: 'evoSelectItem' });
  readonly rotulo = input('', { alias: 'evoSelectItemLabel' });
  readonly desactivado = input(false, {
    alias: 'evoSelectItemDisabled',
    transform: booleanAttribute,
  });

  readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly activo = signal(false);

  get disabled(): boolean {
    return this.desactivado();
  }

  getLabel(): string {
    return this.rotulo();
  }

  setActiveStyles(): void {
    this.activo.set(true);
    // jsdom não implementa scrollIntoView.
    this.elemento.scrollIntoView?.({ block: 'nearest' });
  }

  setInactiveStyles(): void {
    this.activo.set(false);
  }
}
