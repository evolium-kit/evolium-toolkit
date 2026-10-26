import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { EvoMenu } from './evo-menu';
import { EvoMenuBar } from './evo-menu-bar';
import {
  EvoMenuCheckbox,
  EvoMenuGroup,
  EvoMenuItem,
  EvoMenuRadio,
  EvoMenuSeparator,
} from './evo-menu-item';
import { EvoMenuTrigger } from './evo-menu-trigger';

/**
 * Pré-visualização para o Theme Studio, desenhada num iframe.
 *
 * Os painéis estão **embutidos** (um `<evo-menu>` sem gatilho), para que se
 * vejam todos os estados lado a lado sem abrir nada: item normal, em foco,
 * actual (`selected`), desactivado, com atalho, caixa de verificação, escolha
 * única, separador, submenu e a barra de menus. O Studio passa o `size`.
 */
@Component({
  selector: 'evo-menu-preview',
  imports: [
    EvoMenu,
    EvoMenuItem,
    EvoMenuCheckbox,
    EvoMenuRadio,
    EvoMenuGroup,
    EvoMenuSeparator,
    EvoMenuBar,
    EvoMenuTrigger,
  ],
  template: `
    <div class="pv__row">
      <evo-menu [size]="size()" aria-label="Estados do menu">
        <button evoMenuItem>Normal</button>
        <button evoMenuItem selected>Actual (selected)</button>
        <button evoMenuItem disabled>Desactivado</button>
        <button evoMenuItem>
          Com atalho
          <kbd slot="suffix">⌘ K</kbd>
        </button>
        <button evoMenuItem [evoMenuTriggerFor]="submenu">Submenu</button>
        <hr evoMenuSeparator />
        <button evoMenuCheckbox [(checked)]="grelha" [closeOnSelect]="false">Caixa (clica)</button>
        <evo-menu-group label="Escolha única" [(value)]="tamanho">
          <button evoMenuRadio value="a" [closeOnSelect]="false">Opção A</button>
          <button evoMenuRadio value="b" [closeOnSelect]="false">Opção B</button>
        </evo-menu-group>
      </evo-menu>
      <ng-template #submenu>
        <evo-menu [size]="size()">
          <button evoMenuItem>Filho A</button>
          <button evoMenuItem>Filho B</button>
        </evo-menu>
      </ng-template>
    </div>
    <div class="pv__row">
      <evo-menu-bar aria-label="Barra de menus">
        <button evoMenuItem [evoMenuTriggerFor]="ficheiro">Ficheiro</button>
        <button evoMenuItem [evoMenuTriggerFor]="ficheiro">Editar</button>
        <button evoMenuItem [evoMenuTriggerFor]="ficheiro">Ver</button>
      </evo-menu-bar>
      <ng-template #ficheiro>
        <evo-menu [size]="size()">
          <button evoMenuItem>Novo</button>
          <button evoMenuItem>Abrir…</button>
        </evo-menu>
      </ng-template>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoMenuPreview {
  readonly size = input<string | null>(null);

  protected readonly grelha = signal(true);
  protected readonly tamanho = signal<unknown>('a');
}
