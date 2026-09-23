import { isPlatformBrowser } from '@angular/common';
import {
  EnvironmentProviders,
  PLATFORM_ID,
  Provider,
  Type,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  EVO_DARK_MODE_CONFIG,
  EVO_THEME_DEFAULTS,
  EVO_THEME_DEFAULTS_PATCH,
  EVO_THEME_PERSISTENCE,
  EvoDarkModeConfig,
  EvoThemeDefaults,
  EvoThemeDefaultsPatch,
  EvoTokenRecord,
  EvoVariantRecord,
  ThemePersistence,
  normalizeTokens,
} from '@evolium-kit/toolkit/core';
import { EVO_DEFAULT_THEME } from './default-theme';
import { EvoThemeStore } from './evo-theme-store';
import {
  EVO_HTTP_PERSISTENCE_CONFIG,
  EvoHttpPersistenceConfig,
  HttpThemePersistence,
} from './persistence/http-theme-persistence';
import { LocalStorageThemePersistence } from './persistence/local-storage-theme-persistence';

/** Discriminante das features, usado para detectar duplicados em dev. */
export const enum EvoThemeFeatureKind {
  Tokens,
  Variants,
  Persistence,
  DarkMode,
}

export interface EvoThemeFeature<K extends EvoThemeFeatureKind = EvoThemeFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

function feature<K extends EvoThemeFeatureKind>(
  kind: K,
  providers: Provider[],
): EvoThemeFeature<K> {
  return { kind, providers };
}

/**
 * Configura o tema da toolkit.
 *
 * ```ts
 * provideEvoTheme(
 *   withTokens({ light: { 'color-primary': '#0d9488' } }),
 *   withDarkMode({ initial: 'system' }),
 *   withPersistence(),
 * )
 * ```
 */
export function provideEvoTheme(...features: EvoThemeFeature[]): EnvironmentProviders {
  const seen = new Set<EvoThemeFeatureKind>();
  const providers: (Provider | EnvironmentProviders)[] = [
    {
      provide: EVO_THEME_DEFAULTS,
      useFactory: (): EvoThemeDefaults => {
        const patches = inject(EVO_THEME_DEFAULTS_PATCH, { optional: true }) ?? [];
        return patches.reduce<EvoThemeDefaults>(
          (acc, patch) => ({
            ...acc,
            tokens: { ...acc.tokens, ...(patch.tokens ?? {}) },
            darkTokens: { ...acc.darkTokens, ...(patch.darkTokens ?? {}) },
            variants: { ...acc.variants, ...(patch.variants ?? {}) },
            scheme: patch.scheme ?? acc.scheme,
          }),
          EVO_DEFAULT_THEME,
        );
      },
    },
  ];

  for (const item of features) {
    if (isDevMode() && seen.has(item.kind)) {
      throw new Error(
        `[evo-theme] feature de tema duplicada (kind=${item.kind}). ` +
          `Cada with…() só pode ser passada uma vez a provideEvoTheme().`,
      );
    }
    seen.add(item.kind);
    providers.push(...item.providers);
  }

  providers.push(
    provideEnvironmentInitializer(() => {
      // Instanciar o store aqui é o que garante que o <style> é escrito antes
      // do primeiro render — no servidor e no browser.
      const store = inject(EvoThemeStore);
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        // Não é aguardado: o tema por omissão já está aplicado, e bloquear o
        // arranque por causa de uma leitura de storage não se justifica.
        void store.restore();
      }
    }),
  );

  return makeEnvironmentProviders(providers);
}

/** Sobrepõe tokens ao tema por omissão. */
export function withTokens(
  tokens: { light?: EvoTokenRecord; dark?: EvoTokenRecord } | EvoTokenRecord,
): EvoThemeFeature<EvoThemeFeatureKind.Tokens> {
  const isSplit = 'light' in tokens || 'dark' in tokens;
  const light = isSplit ? ((tokens as { light?: EvoTokenRecord }).light ?? {}) : tokens;
  const dark = isSplit ? ((tokens as { dark?: EvoTokenRecord }).dark ?? {}) : {};

  const patch: EvoThemeDefaultsPatch = {
    tokens: normalizeTokens(light as EvoTokenRecord),
    darkTokens: normalizeTokens(dark),
  };

  return feature(EvoThemeFeatureKind.Tokens, [
    { provide: EVO_THEME_DEFAULTS_PATCH, useValue: patch, multi: true },
  ]);
}

/**
 * Regista variantes nomeadas.
 *
 * ```ts
 * withVariants({ button: { cta: { 'button-bg': '#f59e0b' } } })
 * ```
 */
export function withVariants(
  variants: Readonly<Record<string, Readonly<Record<string, EvoTokenRecord>>>>,
): EvoThemeFeature<EvoThemeFeatureKind.Variants> {
  const flat: Record<string, EvoTokenRecord> = {};
  for (const component of Object.keys(variants)) {
    const byName = variants[component];
    if (!byName) continue;
    for (const name of Object.keys(byName)) {
      const tokens = byName[name];
      if (!tokens) continue;
      flat[`${component}.${name}`] = normalizeTokens(tokens);
    }
  }

  const patch: EvoThemeDefaultsPatch = { variants: flat as EvoVariantRecord };
  return feature(EvoThemeFeatureKind.Variants, [
    { provide: EVO_THEME_DEFAULTS_PATCH, useValue: patch, multi: true },
  ]);
}

/** Activa a persistência. Sem argumento, usa `localStorage`. */
export function withPersistence(
  adapter?: Type<ThemePersistence> | ThemePersistence,
): EvoThemeFeature<EvoThemeFeatureKind.Persistence> {
  let provider: Provider;
  if (adapter === undefined) {
    provider = { provide: EVO_THEME_PERSISTENCE, useClass: LocalStorageThemePersistence };
  } else if (typeof adapter === 'function') {
    provider = { provide: EVO_THEME_PERSISTENCE, useClass: adapter };
  } else {
    provider = { provide: EVO_THEME_PERSISTENCE, useValue: adapter };
  }
  return feature(EvoThemeFeatureKind.Persistence, [provider]);
}

/** Persistência num backend. Requer `provideHttpClient()`. */
export function withHttpPersistence(
  config: EvoHttpPersistenceConfig,
): EvoThemeFeature<EvoThemeFeatureKind.Persistence> {
  return feature(EvoThemeFeatureKind.Persistence, [
    { provide: EVO_HTTP_PERSISTENCE_CONFIG, useValue: config },
    { provide: EVO_THEME_PERSISTENCE, useClass: HttpThemePersistence },
  ]);
}

/** Configura o modo escuro. Por omissão segue o sistema operativo. */
export function withDarkMode(
  config: EvoDarkModeConfig = {},
): EvoThemeFeature<EvoThemeFeatureKind.DarkMode> {
  return feature(EvoThemeFeatureKind.DarkMode, [
    {
      provide: EVO_DARK_MODE_CONFIG,
      useValue: { initial: 'system', followSystem: true, ...config } satisfies EvoDarkModeConfig,
    },
  ]);
}
