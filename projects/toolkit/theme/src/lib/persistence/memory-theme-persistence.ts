import { Injectable } from '@angular/core';
import { EvoThemeSnapshot, ThemePersistence } from '@evolium-kit/toolkit/core';

/**
 * Persistência em memória.
 *
 * É o default seguro no servidor e o adapter a usar em testes: tem o mesmo
 * contrato dos outros sem tocar em nenhuma API de plataforma.
 */
@Injectable()
export class MemoryThemePersistence implements ThemePersistence {
  readonly id = 'memory';

  private snapshot: EvoThemeSnapshot | null = null;

  async load(): Promise<EvoThemeSnapshot | null> {
    return this.snapshot;
  }

  async save(snapshot: EvoThemeSnapshot): Promise<void> {
    this.snapshot = snapshot;
  }

  async clear(): Promise<void> {
    this.snapshot = null;
  }
}
