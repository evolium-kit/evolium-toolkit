import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EvoButton, EvoCard, EvoProgressBar } from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';

/**
 * `<evo-progress-bar>`: manual (determinate/indeterminate) e router.
 *
 * O modo `router` não se demonstra aqui dentro — está montado uma vez em
 * `app.ts`, ao lado do `<router-outlet>`, que é onde faz sentido na vida
 * real. Os links abaixo navegam mesmo (para uma rota inexistente, e de
 * volta), para se ver a barra no topo real da janela.
 */
@Component({
  selector: 'app-progress-bar-demo',
  imports: [EvoCard, EvoButton, EvoProgressBar, EvoTokensDirective, RouterLink],
  templateUrl: './progress-bar-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarDemo {
  protected readonly manual = signal<number | null>(null);
  protected readonly indeterminado = signal(false);
}
