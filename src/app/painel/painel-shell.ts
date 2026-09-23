import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { EvoButton } from '@evolium-kit/toolkit/components';
import { EvoDashboardShell, EvoNavItem } from '@evolium-kit/toolkit/layouts';
import { EvoResourceRegistry } from '@evolium-kit/toolkit/services';

/**
 * Shell do dashboard: monta o layout e liga-o à sessão.
 *
 * A ligação ao `auth` é feita **aqui**, na aplicação, e não dentro do
 * `EvoDashboardShell`: o shell recebe os papéis por input, o que o mantém
 * utilizável sem o kernel de serviços.
 */
@Component({
  selector: 'app-painel-shell',
  imports: [RouterOutlet, EvoDashboardShell, EvoButton],
  template: `
    <evo-dashboard-shell [nav]="nav()" [roles]="papeis()" [(sidebar)]="sidebar">
      <span slot="brand">Evolium</span>

      <div slot="topbar-end">
        <span class="ps__utilizador">{{ auth.currentUser()?.name }}</span>
        <button evoButton variant="ghost" size="sm" (click)="sair()">Sair</button>
      </div>

      <router-outlet />

      <div slot="footer">Evolium Toolkit — demonstração da Fase 5</div>
    </evo-dashboard-shell>
  `,
  styles: `
    .ps__utilizador {
      color: var(--evo-color-on-surface-muted);
      font-size: var(--evo-font-size-md);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelShell {
  private readonly registry = inject(EvoResourceRegistry);
  private readonly router = inject(Router);

  protected readonly auth = this.registry.get('auth');
  protected readonly papeis = computed(() => this.auth.roles());
  protected readonly sidebar = signal<'expanded' | 'collapsed' | 'hidden'>('expanded');

  protected readonly nav = signal<readonly EvoNavItem[]>([
    { label: 'Facturação', route: '/painel', icon: '▤' },
    {
      label: 'Gestão',
      children: [
        { label: 'Clientes', route: '/painel/clientes' },
        { label: 'Relatórios', route: '/painel/relatorios', badge: 2 },
      ],
    },
    // Só visível para quem tiver o papel `admin`.
    { label: 'Administração', route: '/painel/admin', icon: '⚙', roles: ['admin'] },
    // Nunca visível nesta demonstração: nenhum utilizador tem `auditor`.
    { label: 'Auditoria', route: '/painel/auditoria', roles: ['auditor'] },
  ]);

  protected async sair(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/auth/login');
  }
}
