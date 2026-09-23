/*
 * API pública de @evolium-kit/toolkit
 *
 * O entry point primário exporta apenas metadados. Tudo o resto vive em
 * subpaths, para que o consumidor só pague pelo que importa:
 *
 *   import { EvoButton } from '@evolium-kit/toolkit/components';
 *   import { provideEvoTheme } from '@evolium-kit/toolkit/theme';
 */

/** Versão do pacote, para diagnóstico. */
export const EVO_TOOLKIT_VERSION = '0.1.0';
