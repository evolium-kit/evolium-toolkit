import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EvoBadge, EvoButton, EvoCard, EvoField, EvoInput } from '@evolium-kit/toolkit/components';
import { EvoAuth, EvoError, EvoResourceRegistry } from '@evolium-kit/toolkit/services';

/**
 * Kernel de serviços: plugins por ordem topológica, `EvoAuth` e um resource
 * (`facturas`) definido fora da toolkit, em `src/app/facturas.plugin.ts`.
 */
@Component({
  selector: 'app-services-demo',
  imports: [EvoCard, EvoButton, EvoBadge, EvoField, EvoInput, DecimalPipe],
  templateUrl: './services-demo.html',
  styleUrls: ['../shared/demo.css', './services-demo.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesDemo {
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
}
