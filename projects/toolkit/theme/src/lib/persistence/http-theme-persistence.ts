import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject, isDevMode } from '@angular/core';
import { EvoThemeSnapshot, ThemePersistence } from '@evolium-kit/toolkit/core';
import { catchError, firstValueFrom, of } from 'rxjs';

export interface EvoHttpPersistenceConfig {
  readonly url: string;
  /** Sufixo do endpoint, para temas por inquilino ou por utilizador. */
  readonly scope?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export const EVO_HTTP_PERSISTENCE_CONFIG = new InjectionToken<EvoHttpPersistenceConfig>(
  'EVO_HTTP_PERSISTENCE_CONFIG',
);

/**
 * Persistência num backend. Requer `provideHttpClient()` na aplicação.
 *
 * O `load()` engole qualquer erro e devolve `null`: um backend de temas em baixo
 * nunca pode impedir a aplicação de arrancar.
 */
@Injectable()
export class HttpThemePersistence implements ThemePersistence {
  readonly id = 'http';

  private readonly http = inject(HttpClient);
  private readonly config = inject(EVO_HTTP_PERSISTENCE_CONFIG);

  private get endpoint(): string {
    const { url, scope } = this.config;
    return scope ? `${url}/${encodeURIComponent(scope)}` : url;
  }

  load(): Promise<EvoThemeSnapshot | null> {
    return firstValueFrom(
      this.http.get<EvoThemeSnapshot>(this.endpoint, { headers: this.config.headers }).pipe(
        catchError((error: HttpErrorResponse) => {
          // 404 é o caso normal de "ainda não há tema guardado".
          if (error.status !== 404 && isDevMode()) {
            console.warn('[evo-theme] não foi possível carregar o tema:', error.status);
          }
          return of(null);
        }),
      ),
    );
  }

  async save(snapshot: EvoThemeSnapshot): Promise<void> {
    await firstValueFrom(this.http.put(this.endpoint, snapshot, { headers: this.config.headers }));
  }

  async clear(): Promise<void> {
    await firstValueFrom(this.http.delete(this.endpoint, { headers: this.config.headers }));
  }
}
