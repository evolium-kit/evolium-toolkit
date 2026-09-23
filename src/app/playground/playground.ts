import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EvoBadge, EvoButton, EvoCard, EvoField, EvoInput } from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { EvoThemeExporter, EvoThemeStore } from '@evolium-kit/toolkit/theme';
import { RouterLink } from '@angular/router';
import { EvoAuth, EvoError, EvoResourceRegistry } from '@evolium-kit/toolkit/services';

/**
 * Playground das Fases 1 e 2.
 *
 * Prova as garantias centrais da toolkit: alterar um token muda o aspecto em
 * toda a aplicaÃ§Ã£o; um override de instÃ¢ncia nÃ£o afecta as outras; e a cascata
 * comporta-se como documentado. Ã‰ aqui que a cascata Ã© realmente validada â€” o
 * jsdom dos testes nÃ£o resolve `var()` nem interpreta `@layer`.
 */
@Component({
  selector: 'app-playground',
  imports: [
    EvoButton,
    EvoCard,
    EvoBadge,
    EvoInput,
    EvoField,
    EvoTokensDirective,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './playground.html',
  styleUrl: './playground.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playground {
  protected readonly theme = inject(EvoThemeStore);
  private readonly exporter = inject(EvoThemeExporter);

  protected readonly scheme = this.theme.resolvedScheme;

  protected readonly primary = computed(
    () => this.theme.activeTokens()['--evo-color-primary'] ?? '#2563eb',
  );

  protected readonly radius = computed(() => this.theme.activeTokens()['--evo-radius-md'] ?? '6px');

  /** `parseInt` nÃ£o existe no contexto de template. */
  protected readonly radiusValue = computed(() => Number.parseInt(this.radius(), 10) || 0);

  protected readonly amostras = ['#2563eb', '#0d9488', '#7c3aed', '#b45309', '#dc2626'] as const;

  protected readonly aGravar = signal(false);
  protected readonly emailInvalido = signal(false);

  // ------------------------------------------------------- Fase 4: serviços

  /** Forma 1 de consumir um resource: o token dedicado do plugin. */
  protected readonly auth = inject(EvoAuth);

  /** Forma 2: o registry genérico, validado contra o EvoResourceMap. */
  private readonly registry = inject(EvoResourceRegistry);
  protected readonly facturas = this.registry.get('facturas');

  /** Nomes dos plugins que arrancaram, por ordem topológica. */
  protected readonly plugins = this.registry.names;

  protected readonly email = signal('ana@evolium.ao');
  protected readonly senha = signal('1234');
  protected readonly aEntrar = signal(false);
  protected readonly aCarregarFacturas = signal(false);
  protected readonly erroAuth = signal<string | null>(null);
  protected readonly erroFacturas = signal<string | null>(null);

  protected async entrar(): Promise<void> {
    this.aEntrar.set(true);
    this.erroAuth.set(null);
    try {
      await this.auth.login({ email: this.email(), password: this.senha() });
    } catch (erro) {
      // Nunca chega aqui um HttpErrorResponse cru: é sempre um EvoError.
      const evo = erro as EvoError;
      this.erroAuth.set(evo.kind === 'unauthorized' ? 'Credenciais inválidas.' : evo.message);
    } finally {
      this.aEntrar.set(false);
    }
  }

  protected async sair(): Promise<void> {
    await this.auth.logout();
    this.erroFacturas.set(null);
  }

  protected async carregarFacturas(): Promise<void> {
    this.aCarregarFacturas.set(true);
    this.erroFacturas.set(null);
    try {
      await this.facturas.carregar();
    } catch (erro) {
      const evo = erro as EvoError;
      this.erroFacturas.set(
        evo.kind === 'unauthorized' ? 'É preciso iniciar sessão primeiro.' : evo.message,
      );
    } finally {
      this.aCarregarFacturas.set(false);
    }
  }

  protected actualizarEmail(evento: Event): void {
    this.email.set((evento.target as HTMLInputElement).value);
  }

  protected actualizarSenha(evento: Event): void {
    this.senha.set((evento.target as HTMLInputElement).value);
  }

  protected definirPrimary(valor: string): void {
    this.theme.setToken('color-primary', valor);
  }

  protected definirRadius(evento: Event): void {
    const alvo = evento.target as HTMLInputElement;
    this.theme.setToken('radius-md', `${alvo.value}px`);
  }

  protected simularEnvio(): void {
    this.aGravar.set(true);
    setTimeout(() => this.aGravar.set(false), 1500);
  }

  protected async guardar(): Promise<void> {
    await this.theme.persist();
  }

  protected exportar(): void {
    this.exporter.downloadAll(this.theme.snapshot());
  }

  protected async reporTudo(): Promise<void> {
    await this.theme.clearPersisted();
  }
}
