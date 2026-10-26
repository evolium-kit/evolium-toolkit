import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EvoButton } from '@evolium-kit/toolkit/components';
import { EvoThemeStore } from '@evolium-kit/toolkit/theme';
import { BadgeDemo } from './badge/badge-demo';
import { ButtonDemo } from './button/button-demo';
import { DataTableDemo } from './data-table/data-table-demo';
import { DrawerDemo } from './drawer/drawer-demo';
import { FieldDemo } from './field/field-demo';
import { MenuDemo } from './menu/menu-demo';
import { ModalDemo } from './modal/modal-demo';
import { SelectDemo } from './select/select-demo';
import { ServicesDemo } from './services/services-demo';
import { TextFieldDemo } from './text-field/text-field-demo';
import { ThemeDemo } from './theme/theme-demo';

/**
 * Playground da toolkit — só orquestra.
 *
 * Cada componente tem a sua pasta (`<componente>/<componente>-demo.*`) com
 * toda a implementação da demo; aqui decide-se apenas o quê e por que ordem
 * se mostra. Para acrescentar um componente: criar a pasta, a demo, e
 * registá-la abaixo e em `playground.html`.
 *
 * É aqui que a cascata é realmente validada — o jsdom dos testes não resolve
 * `var()` nem interpreta `@layer`.
 */
@Component({
  selector: 'app-playground',
  imports: [
    RouterLink,
    EvoButton,
    ThemeDemo,
    ButtonDemo,
    BadgeDemo,
    FieldDemo,
    TextFieldDemo,
    SelectDemo,
    ModalDemo,
    DrawerDemo,
    MenuDemo,
    DataTableDemo,
    ServicesDemo,
  ],
  templateUrl: './playground.html',
  styleUrl: './playground.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playground {
  protected readonly theme = inject(EvoThemeStore);
  protected readonly scheme = this.theme.resolvedScheme;
}
