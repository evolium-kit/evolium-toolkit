import { Injectable, signal } from '@angular/core';
import { EvoResourceMap, EvoResourceName } from './resource-map';

/**
 * Registo dos resources criados pelos plugins.
 *
 * É a única forma genérica de aceder a um resource. Cada plugin também pode
 * expor um `InjectionToken` dedicado (por exemplo `EvoAuth`) para quem prefere
 * `inject()` directo — as duas formas devolvem exactamente o mesmo objecto.
 */
@Injectable({ providedIn: 'root' })
export class EvoResourceRegistry {
  private readonly resources = new Map<string, unknown>();
  private readonly _names = signal<readonly string[]>([]);

  /** Nomes registados, para diagnóstico e para o Theme Studio. */
  readonly names = this._names.asReadonly();

  /** @internal Usado pelo bootstrap do kernel. */
  register(name: string, api: unknown): void {
    if (this.resources.has(name)) {
      throw new Error(
        `[evo] resource duplicado: "${name}". Dois plugins não podem partilhar o mesmo nome.`,
      );
    }
    this.resources.set(name, api);
    this._names.update((names) => [...names, name]);
  }

  get<K extends EvoResourceName>(name: K): EvoResourceMap[K] {
    const found = this.resources.get(name);
    if (found === undefined) {
      const registered = [...this.resources.keys()].join(', ') || '(nenhum)';
      throw new Error(
        `[evo] o resource "${name}" não está registado. ` +
          `Acrescenta o plugin em provideEvoServices(withPlugin(...)). ` +
          `Registados: ${registered}.`,
      );
    }
    return found as EvoResourceMap[K];
  }

  has(name: string): boolean {
    return this.resources.has(name);
  }
}
