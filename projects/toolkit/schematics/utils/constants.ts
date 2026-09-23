export const TOOLKIT = '@evolium-kit/toolkit';

/** Dependências que a toolkit declara como peer e o consumidor precisa mesmo. */
export const PEER_DEPS: ReadonlyArray<readonly [string, string]> = [
  ['@angular/cdk', '^21.2.0'],
  ['@angular/forms', '^21.2.0'],
];

/** Folhas de estilo, pela ordem em que têm de ser importadas. */
export const STYLE_IMPORTS: readonly string[] = [
  `${TOOLKIT}/styles/evolium-theme.css`,
  `${TOOLKIT}/styles/evolium-components.css`,
  `${TOOLKIT}/styles/evolium-layouts.css`,
];

/**
 * Declaração da ordem das camadas.
 *
 * Tem de ser a primeira regra do ficheiro, antes de qualquer `@import`. Sem
 * ela, o Tailwind declara a sua própria ordem e as camadas `evo.*` acabam
 * depois de `utilities` — `class="evo-button p-6"` deixaria de respeitar o p-6.
 */
export const LAYER_STATEMENT =
  '@layer theme, base, evo.tokens, evo.base, evo.components, evo.variants, evo.overrides,\n' +
  '  components, utilities;';
