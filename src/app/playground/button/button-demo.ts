import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { EvoButton, EvoCard } from '@evolium-kit/toolkit/components';

/** `evoButton`: variantes, tamanhos, desactivado e `loading`. */
@Component({
  selector: 'app-button-demo',
  imports: [EvoCard, EvoButton],
  templateUrl: './button-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemo {
  protected readonly aGravar = signal(false);

  protected simularEnvio(): void {
    this.aGravar.set(true);
    setTimeout(() => this.aGravar.set(false), 1500);
  }
}
