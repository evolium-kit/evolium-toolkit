import {
  Directive,
  ElementRef,
  Renderer2,
  RendererStyleFlags2,
  effect,
  inject,
  input,
} from '@angular/core';
import { normalizeTokenName } from './token-utils';

/** Valores aceites por `[evoTokens]`. `null`/`undefined` removem o token. */
export type EvoTokenMap = Readonly<Record<string, string | number | null | undefined>>;

/**
 * Aplica tokens de tema a um elemento, e por herança a toda a sua subárvore.
 *
 * É a mesma directiva para os dois eixos de personalização, porque a herança de
 * custom properties trata do resto:
 *
 * - no próprio componente, afecta só aquela instância;
 * - num contentor, re-tematiza tudo lá dentro sem tocar em nenhum componente.
 *
 * ```html
 * <button evoButton [evoTokens]="{ 'button-bg': '#0d9488' }">Guardar</button>
 *
 * <section [evoTokens]="{ 'color-primary': '#7c3aed' }">
 *   <evo-card><button evoButton>Herda roxo</button></evo-card>
 * </section>
 * ```
 */
@Directive({
  selector: '[evoTokens]',
})
export class EvoTokensDirective {
  /** Aceita a forma curta (`button-bg`) ou completa (`--evo-button-bg`). */
  readonly evoTokens = input<EvoTokenMap>({});

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  /** Tokens aplicados na última passagem, para os saber remover na seguinte. */
  private applied: readonly string[] = [];

  constructor() {
    effect(() => {
      const next = this.evoTokens();

      // Remover primeiro garante que um token retirado do mapa desaparece mesmo.
      for (const name of this.applied) {
        this.renderer.removeStyle(this.element, name, RendererStyleFlags2.DashCase);
      }

      const names: string[] = [];
      for (const key of Object.keys(next)) {
        const value = next[key];
        if (value === null || value === undefined) continue;

        const name = normalizeTokenName(key);
        // Renderer2 (e não element.style) para que o override também seja
        // serializado no HTML servido em SSR — sem isso haveria flash.
        // DashCase é obrigatório: sem ele o Angular tenta camelCase e a custom
        // property é ignorada em silêncio.
        this.renderer.setStyle(this.element, name, String(value), RendererStyleFlags2.DashCase);
        names.push(name);
      }

      this.applied = names;
    });
  }
}
