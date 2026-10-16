import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EvoBadge, EvoCard } from '@evolium-kit/toolkit/components';

/** `<evo-badge>`: tons e nome acessível (`label`). */
@Component({
  selector: 'app-badge-demo',
  imports: [EvoCard, EvoBadge],
  templateUrl: './badge-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemo {}
