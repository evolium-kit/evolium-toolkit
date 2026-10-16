import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EvoBadge, EvoButton, EvoCard } from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { EvoThemeExporter, EvoThemeStore } from '@evolium-kit/toolkit/theme';

/**
 * Tema: prova que alterar um token muda o aspecto em toda a aplicação, que um
 * override de instância não afecta as outras, que a subárvore herda, e a
 * persistência/exportação do tema.
 */
@Component({
  selector: 'app-theme-demo',
  imports: [EvoCard, EvoButton, EvoBadge, EvoTokensDirective],
  templateUrl: './theme-demo.html',
  styleUrls: ['../shared/demo.css', './theme-demo.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeDemo {
  protected readonly theme = inject(EvoThemeStore);
  private readonly exporter = inject(EvoThemeExporter);

  protected readonly primary = computed(
    () => this.theme.activeTokens()['--evo-color-primary'] ?? '#2563eb',
  );

  protected readonly radius = computed(() => this.theme.activeTokens()['--evo-radius-md'] ?? '6px');

  /** `parseInt` não existe no contexto de template. */
  protected readonly radiusValue = computed(() => Number.parseInt(this.radius(), 10) || 0);

  protected readonly amostras = ['#2563eb', '#0d9488', '#7c3aed', '#b45309', '#dc2626'] as const;

  protected definirPrimary(valor: string): void {
    this.theme.setToken('color-primary', valor);
  }

  protected definirRadius(evento: Event): void {
    const alvo = evento.target as HTMLInputElement;
    this.theme.setToken('radius-md', `${alvo.value}px`);
  }

  protected async guardar(): Promise<void> {
    await this.theme.persist();
  }

  protected exportar(): void {
    this.exporter.downloadAll(this.theme.snapshot());
  }

  protected async reporTudo(): Promise<void> {
    // await this.theme.clearPersisted();
  }
}
