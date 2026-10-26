import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  EvoButton,
  EvoCard,
  EvoContextMenuTrigger,
  EvoMenu,
  EvoMenuBar,
  EvoMenuCheckbox,
  EvoMenuEntry,
  EvoMenuGroup,
  EvoMenuItem,
  EvoMenuRadio,
  EvoMenuSeparator,
  EvoMenuTrigger,
  EvoModal,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';

/**
 * `<evo-menu>`: os mesmos casos do Menu do Joy UI (básico, tamanhos, seleccionado,
 * botão de ícone, posição, grupos, estado controlado, barra de menus) e os que o
 * Joy não tem (submenus, menu de contexto, por dados, embutido, dentro de um modal).
 *
 * Nada aparece aberto ao carregar: cada botão descreve o menu que abre.
 */
@Component({
  selector: 'app-menu-demo',
  imports: [
    EvoCard,
    EvoButton,
    EvoMenu,
    EvoMenuItem,
    EvoMenuCheckbox,
    EvoMenuRadio,
    EvoMenuGroup,
    EvoMenuSeparator,
    EvoMenuBar,
    EvoMenuTrigger,
    EvoContextMenuTrigger,
    EvoModal,
    EvoTokensDirective,
  ],
  templateUrl: './menu-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuDemo {
  protected readonly ultimo = signal('—');

  protected readonly projecto = signal('Staging - web');
  protected readonly projectos = ['Random project', 'Production - web', 'Staging - web'];

  protected readonly grelha = signal(true);
  protected readonly regua = signal(false);
  protected readonly tamanho = signal<'sm' | 'md' | 'lg'>('md');

  protected readonly aberto = signal(false);
  protected readonly modal = signal(false);

  protected escolheu(que: string): void {
    this.ultimo.set(que);
  }

  /** Por dados: o estado é daqui, o menu só o mostra. */
  protected readonly entradas = computed<EvoMenuEntry[]>(() => [
    { label: 'Novo ficheiro', suffix: '⌘ N', run: () => this.escolheu('Novo ficheiro') },
    {
      label: 'Abrir recente',
      children: [
        { label: 'relatorio.pdf', run: () => this.escolheu('relatorio.pdf') },
        { label: 'facturas.xlsx', run: () => this.escolheu('facturas.xlsx') },
        { type: 'separator' },
        { label: 'Limpar lista', disabled: true },
      ],
    },
    { type: 'separator' },
    {
      type: 'checkbox',
      label: 'Mostrar grelha',
      checked: this.grelha(),
      run: (v) => this.grelha.set(v),
    },
    {
      type: 'group',
      label: 'Tamanho',
      value: this.tamanho(),
      run: (v) => this.tamanho.set(v as 'sm' | 'md' | 'lg'),
      children: [
        { type: 'radio', label: 'Pequeno', value: 'sm' },
        { type: 'radio', label: 'Médio', value: 'md' },
        { type: 'radio', label: 'Grande', value: 'lg' },
      ],
    },
    { type: 'separator' },
    { label: 'Documentação', href: '#documentacao' },
  ]);
}
