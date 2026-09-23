import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shell para ecrãs de autenticação: um cartão centrado na viewport.
 *
 * ```html
 * <evo-auth-shell>
 *   <span slot="brand">Evolium</span>
 *   <h1 slot="title">Entrar</h1>
 *   <p slot="subtitle">Acede à tua conta.</p>
 *   <form>…</form>
 *   <a slot="footer" routerLink="/auth/registar">Criar conta</a>
 * </evo-auth-shell>
 * ```
 */
@Component({
  selector: 'evo-auth-shell',
  template: `
    <div class="evo-auth-shell__caixa">
      <ng-content select="[slot=brand]" />
      <ng-content select="[slot=title]" />
      <ng-content select="[slot=subtitle]" />
      <ng-content />
      <ng-content select="[slot=footer]" />
    </div>
  `,
  styleUrl: './auth-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-auth-shell',
    '[attr.data-evo-align]': 'align()',
  },
})
export class EvoAuthShell {
  /** Posição vertical do cartão. `center` por omissão. */
  readonly align = input<'center' | 'top'>('center');
}
