import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { EvoThemeSnapshot, ThemePersistence } from '@evolium-kit/toolkit/core';

const STORAGE_KEY = 'evo.theme.v1';

/**
 * Persistência em `localStorage`.
 *
 * Nunca lança: em SSR, em modo privado do Safari, com a quota esgotada ou com
 * cookies bloqueados, degrada para "sem persistência" e o tema continua a
 * funcionar em memória.
 *
 * Nota de SSR: o servidor não vê o tema guardado, pelo que renderiza sempre o
 * tema por omissão. Se o modo escuro persistido for requisito de produto, usar
 * um adapter baseado em cookie (legível via `inject(REQUEST)`) em vez deste.
 */
@Injectable()
export class LocalStorageThemePersistence implements ThemePersistence {
  readonly id = 'localStorage';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly view = inject(DOCUMENT).defaultView;

  /**
   * `null` sempre que o armazenamento não estiver realmente disponível.
   * A sonda é necessária porque o mero acesso a `localStorage` lança em alguns
   * browsers, e `setItem` lança quando a quota é zero.
   */
  private get storage(): Storage | null {
    if (!this.isBrowser || !this.view) return null;
    try {
      const storage = this.view.localStorage;
      const probe = '__evo_probe__';
      storage.setItem(probe, '1');
      storage.removeItem(probe);
      return storage;
    } catch {
      return null;
    }
  }

  async load(): Promise<EvoThemeSnapshot | null> {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as EvoThemeSnapshot;
      return parsed.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  async save(snapshot: EvoThemeSnapshot): Promise<void> {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // QuotaExceededError — o tema continua aplicado, só não sobrevive ao recarregar.
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      /* ver acima */
    }
  }
}
