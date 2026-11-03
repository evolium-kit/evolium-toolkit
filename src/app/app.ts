import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EvoProgressBar } from '@evolium-kit/toolkit/components';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EvoProgressBar],
  template: `
    <evo-progress-bar mode="router" ariaLabel="A mudar de página" />
    <router-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
