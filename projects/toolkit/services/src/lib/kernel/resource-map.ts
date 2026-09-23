/**
 * Mapa de resources registados, indexado pelo nome do plugin.
 *
 * Esta interface nasce vazia de propósito. Cada plugin aumenta-a por declaration
 * merging, e é isso que torna `registry.get('auth')` type-safe **sem o kernel
 * alguma vez importar o plugin de auth**:
 *
 * ```ts
 * declare module '@evolium-kit/toolkit/services' {
 *   interface EvoResourceMap {
 *     auth: EvoAuthApi;
 *   }
 * }
 * ```
 *
 * Um plugin que estenda outro intersecta o tipo em vez de o substituir:
 *
 * ```ts
 * declare module '@evolium-kit/toolkit/services' {
 *   interface EvoResourceMap {
 *     auth: EvoAuthApi & EvoOAuthExtension;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EvoResourceMap {}

/** Nomes de resources conhecidos em tempo de compilação. */
export type EvoResourceName = keyof EvoResourceMap & string;
