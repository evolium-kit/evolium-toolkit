import { InjectionToken } from '@angular/core';
import { EvoThemeDefaults, EvoThemeSnapshot, EvoVariantRecord } from './theme.model';

/**
 * Estratégia de persistência do tema.
 *
 * Promise e não Observable: a API é one-shot, não há stream, e evita arrastar
 * RxJS para o entry point /core.
 *
 * Contrato: nenhuma implementação pode lançar. O arranque da aplicação nunca
 * deve falhar por causa do tema — devolver `null` é sempre preferível a rebentar.
 */
export interface ThemePersistence {
  load(): Promise<EvoThemeSnapshot | null>;
  save(snapshot: EvoThemeSnapshot): Promise<void>;
  clear(): Promise<void>;
  /** Identificador para diagnóstico no Theme Studio. */
  readonly id?: string;
}

export const EVO_THEME_PERSISTENCE = new InjectionToken<ThemePersistence>('EVO_THEME_PERSISTENCE');

/** Valores com que o tema arranca, antes de qualquer persistência ser lida. */
export const EVO_THEME_DEFAULTS = new InjectionToken<EvoThemeDefaults>('EVO_THEME_DEFAULTS');

/**
 * Contribuição parcial aos defaults do tema, registada com `multi: true`.
 *
 * Existe para que `withTokens()` e `withVariants()` se possam combinar: se cada
 * uma fornecesse `EVO_THEME_DEFAULTS` directamente, a última venceria e a outra
 * seria descartada em silêncio. As contribuições são fundidas por ordem de
 * declaração, com os mapas de tokens a fundir chave a chave.
 */
export const EVO_THEME_DEFAULTS_PATCH = new InjectionToken<readonly EvoThemeDefaultsPatch[]>(
  'EVO_THEME_DEFAULTS_PATCH',
);

export interface EvoThemeDefaultsPatch {
  readonly tokens?: Readonly<Record<string, string>>;
  readonly darkTokens?: Readonly<Record<string, string>>;
  readonly variants?: EvoVariantRecord;
  readonly scheme?: 'light' | 'dark' | 'system';
}

export interface EvoDarkModeConfig {
  /** Esquema inicial. Omissão: `system`. */
  readonly initial?: 'light' | 'dark' | 'system';
  /** Reagir a mudanças de `prefers-color-scheme`. Omissão: `true`. */
  readonly followSystem?: boolean;
}

export const EVO_DARK_MODE_CONFIG = new InjectionToken<EvoDarkModeConfig>('EVO_DARK_MODE_CONFIG');
