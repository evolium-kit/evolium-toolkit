/*
 * API pública de @evolium-kit/toolkit/core
 *
 * Camada base: tipos, tokens de DI e utilitários. Não depende de mais nenhum
 * entry point da toolkit, e é a única camada que todas as outras podem importar.
 */

export * from './lib/theme.model';
export * from './lib/theme.tokens';
export * from './lib/token-utils';
export * from './lib/component-meta';
export * from './lib/evo-tokens.directive';
