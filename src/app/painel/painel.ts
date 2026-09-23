import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { EvoBadge, EvoButton, EvoCard } from '@evolium-kit/toolkit/components';
import { EvoError, EvoResourceRegistry } from '@evolium-kit/toolkit/services';

/**
 * Página de conteúdo do dashboard.
 *
 * Trata os quatro estados obrigatórios: loading, vazio, erro e pronto.
 */
@Component({
  selector: 'app-painel',
  imports: [EvoCard, EvoBadge, EvoButton, DecimalPipe],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Painel {
  private readonly registry = inject(EvoResourceRegistry);
  protected readonly facturas = this.registry.get('facturas');
  protected readonly auth = this.registry.get('auth');

  protected readonly estado = signal<'idle' | 'loading' | 'empty' | 'error' | 'ready'>('idle');
  protected readonly erro = signal<string | null>(null);

  constructor() {
    void this.carregar();
  }

  protected async carregar(): Promise<void> {
    this.estado.set('loading');
    this.erro.set(null);
    try {
      await this.facturas.carregar();
      this.estado.set(this.facturas.lista().length === 0 ? 'empty' : 'ready');
    } catch (e) {
      const evo = e as EvoError;
      this.erro.set(evo.kind === 'unauthorized' ? 'A sessão expirou. Entra de novo.' : evo.message);
      this.estado.set('error');
    }
  }

  protected tom(estado: string): string {
    if (estado === 'paga') return 'success';
    if (estado === 'vencida') return 'danger';
    return 'warning';
  }
}
