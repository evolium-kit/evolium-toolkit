/**
 * Modelo de dados do tema. Vive em /core (e não em /theme) porque tanto o store
 * como os adapters de persistência e o Theme Studio dependem destes tipos.
 */

/** Esquema de cor. `system` segue a preferência do sistema operativo. */
export type EvoColorScheme = 'light' | 'dark' | 'system';

/**
 * Mapa de tokens CSS. As chaves são sempre nomes completos de custom property
 * (`--evo-color-primary`) depois de normalizadas por `normalizeTokenName`.
 */
export type EvoTokenRecord = Readonly<Record<string, string>>;

/**
 * Tokens de uma variante nomeada, indexados por `<componente>.<variante>`
 * — por exemplo `button.danger`.
 */
export type EvoVariantRecord = Readonly<Record<string, EvoTokenRecord>>;

/** Estado completo e serializável de um tema. É isto que a persistência guarda. */
export interface EvoThemeSnapshot {
  readonly id: string;
  readonly name: string;
  /** Versão do formato. Um snapshot com versão diferente é descartado ao carregar. */
  readonly version: 1;
  /** Tokens aplicados em `:root` (modo claro). */
  readonly tokens: EvoTokenRecord;
  /** Tokens aplicados quando o esquema escuro está activo. */
  readonly darkTokens: EvoTokenRecord;
  readonly variants: EvoVariantRecord;
  readonly scheme: EvoColorScheme;
  /** ISO 8601. */
  readonly updatedAt: string;
}

/** Valores por omissão com que o `EvoThemeStore` arranca. */
export interface EvoThemeDefaults {
  readonly id: string;
  readonly name: string;
  readonly tokens: EvoTokenRecord;
  readonly darkTokens: EvoTokenRecord;
  readonly variants: EvoVariantRecord;
  readonly scheme: EvoColorScheme;
}
