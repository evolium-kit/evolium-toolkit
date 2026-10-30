import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  EvoButton,
  EvoCard,
  EvoTab,
  EvoTabEntry,
  EvoTabList,
  EvoTabPanel,
  EvoTabs,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';

/**
 * `<evo-tabs>`: básico, vertical, desactivada, activação automática, por
 * dados, scroll, sticky, keepMounted e tokens.
 */
@Component({
  selector: 'app-tabs-demo',
  imports: [EvoCard, EvoTabs, EvoTabList, EvoTab, EvoTabPanel, EvoTokensDirective],
  templateUrl: './tabs-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsDemo {
  protected readonly basico = signal<string>('geral');
  protected readonly vertical = signal<string>('perfil');
  protected readonly comDesactivada = signal<string>('a');
  protected readonly automatica = signal<string>('a');
  protected readonly comScroll = signal<string>('t1');
  protected readonly preservaEstado = signal<string>('escrever');
  protected readonly rascunho = signal('');

  protected readonly porDados = signal<string | number>(1);
  protected readonly secoes: readonly EvoTabEntry[] = [
    { value: 1, label: 'Resumo' },
    { value: 2, label: 'Detalhe' },
    { value: 3, label: 'Histórico', disabled: true },
  ];

  protected readonly scrollTabs = Array.from({ length: 12 }, (_, i) => `t${i + 1}`);
}
