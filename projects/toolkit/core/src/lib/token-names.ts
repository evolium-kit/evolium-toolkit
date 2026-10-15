import { EvoBuiltinTokenNames } from './generated/token-names';

/**
 * Nomes curtos (sem `--evo-`) dos tokens que `[evoTokens]` aceita.
 *
 * A lista base é gerada no build por `tools/generate-component-registry.mjs`
 * a partir do CSS da toolkit: todo o token declarado em `styles/` ou lido por
 * um `var(--evo-…)` de um componente, layout ou página entra aqui sozinho. Um
 * recurso novo não precisa de registar nada.
 *
 * É uma interface para que uma aplicação possa acrescentar os seus próprios
 * tokens e ganhar o mesmo autocomplete:
 *
 * ```ts
 * declare module '@evolium-kit/toolkit/core' {
 *   interface EvoTokenNames {
 *     'kpi-accent': true;
 *   }
 * }
 * ```
 */
export interface EvoTokenNames extends EvoBuiltinTokenNames {}

/** Nome curto de um token conhecido, por exemplo `text-field-ring-width`. */
export type EvoTokenName = keyof EvoTokenNames & string;

/** Valores aceites por `[evoTokens]`. `null`/`undefined` removem o token. */
export type EvoTokenValue = string | number | null | undefined;

/**
 * Mapa aceite por `[evoTokens]`.
 *
 * As chaves curtas estão limitadas aos tokens conhecidos: um nome errado (por
 * exemplo `ring-width` em vez de `text-field-ring-width`) é um erro de
 * compilação no template, em vez de uma custom property que nenhum CSS lê. A
 * forma completa (`--qualquer-coisa`) continua livre, para tokens que a
 * toolkit não conhece.
 */
export type EvoTokenMap = {
  readonly [K in EvoTokenName | `--${string}`]?: EvoTokenValue;
};
