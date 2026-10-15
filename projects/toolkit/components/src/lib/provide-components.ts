import { Provider } from '@angular/core';
import { provideEvoComponentMeta } from '@evolium-kit/toolkit/core';
import { EVO_BUILTIN_COMPONENT_META } from './generated/registry';

/**
 * Metadados de todos os componentes da toolkit, com pré-visualização e
 * documentação.
 *
 * A lista não é escrita à mão: é gerada a partir das pastas de `lib/` por
 * `tools/generate-component-registry.mjs`. Uma pasta com `<nome>.tokens.ts`
 * entra sozinha no registo.
 */
export { EVO_BUILTIN_COMPONENT_META };

/**
 * Regista os componentes da toolkit no Theme Studio.
 *
 * Só é preciso se o Studio estiver activo; sem isto o Studio abre vazio. Para
 * acrescentar componentes do próprio projecto, chamar também
 * `provideEvoComponentMeta(meuComponenteMeta)`.
 */
export function provideEvoComponents(): Provider[] {
  return provideEvoComponentMeta(...EVO_BUILTIN_COMPONENT_META);
}
