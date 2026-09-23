import { Injectable } from '@angular/core';
import { EvoEventBus } from './types';

/**
 * Barramento de eventos entre plugins.
 *
 * Serve para acoplamento fraco: um plugin de notificações pode reagir a
 * `auth:logout` sem que o plugin de auth saiba que ele existe. Para dependências
 * reais — precisar da API de outro plugin — usa-se `dependsOn` e `ctx.resolve`,
 * que são explícitos e verificados no arranque.
 */
@Injectable({ providedIn: 'root' })
export class EvoEventBusService implements EvoEventBus {
  private readonly ouvintes = new Map<string, Set<(payload: unknown) => void>>();

  emit(tipo: string, payload: unknown): void {
    const conjunto = this.ouvintes.get(tipo);
    if (!conjunto) return;

    // Cópia antes de iterar: um ouvinte pode cancelar-se a si próprio
    // durante a notificação, e mutar o Set em iteração perderia eventos.
    for (const ouvinte of [...conjunto]) {
      try {
        ouvinte(payload);
      } catch (erro) {
        // Um ouvinte com defeito não pode impedir os outros de receber.
        console.error(`[evo] ouvinte de "${tipo}" lançou:`, erro);
      }
    }
  }

  on(tipo: string, handler: (payload: unknown) => void): () => void {
    const conjunto = this.ouvintes.get(tipo) ?? new Set<(payload: unknown) => void>();
    conjunto.add(handler);
    this.ouvintes.set(tipo, conjunto);

    return () => {
      conjunto.delete(handler);
      if (conjunto.size === 0) this.ouvintes.delete(tipo);
    };
  }
}
