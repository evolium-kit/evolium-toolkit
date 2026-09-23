import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EvoNavItem, EvoSidebarState } from '../layout-types';

/**
 * Shell de aplicação autenticada: barra de topo, navegação lateral e conteúdo.
 *
 * ```html
 * <evo-dashboard-shell [nav]="nav()" [roles]="auth.roles()">
 *   <span slot="brand">Evolium</span>
 *   <div slot="topbar-end"><button evoButton variant="ghost">Sair</button></div>
 *   <router-outlet />
 * </evo-dashboard-shell>
 * ```
 *
 * **Os papéis são um input, não uma leitura do plugin de auth.** Ler o auth aqui
 * criaria uma dependência de `/layouts` para `/services`, quebrando a direcção
 * das camadas: um shell tem de poder ser usado numa aplicação que não use o
 * kernel de serviços de todo.
 */
@Component({
  selector: 'evo-dashboard-shell',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-dashboard-shell',
    '[attr.data-evo-sidebar]': 'sidebar()',
  },
})
export class EvoDashboardShell {
  readonly nav = input<readonly EvoNavItem[]>([]);
  /** Papéis do utilizador actual, usados para filtrar a navegação. */
  readonly roles = input<readonly string[]>([]);
  readonly collapsible = input(true, { transform: booleanAttribute });

  /** Estado do painel lateral. `model()` para permitir controlo externo. */
  readonly sidebar = model<EvoSidebarState>('expanded');

  /** Navegação depois de removidos os itens sem permissão. */
  protected readonly navVisivel = computed(() => this.filtrar(this.nav()));

  protected alternarSidebar(): void {
    this.sidebar.update((estado) => (estado === 'expanded' ? 'collapsed' : 'expanded'));
  }

  protected temFilhos(item: EvoNavItem): boolean {
    return (item.children?.length ?? 0) > 0;
  }

  /**
   * Um item sem `roles` é visível para todos. Um item com filhos desaparece se
   * nenhum filho sobreviver ao filtro — um grupo vazio é ruído.
   */
  private filtrar(itens: readonly EvoNavItem[]): readonly EvoNavItem[] {
    const papeis = this.roles();

    const permitido = (item: EvoNavItem): boolean =>
      !item.roles?.length || item.roles.some((papel) => papeis.includes(papel));

    return itens
      .filter(permitido)
      .map((item) => (item.children ? { ...item, children: this.filtrar(item.children) } : item))
      .filter((item) => item.route !== undefined || (item.children?.length ?? 0) > 0);
  }
}
