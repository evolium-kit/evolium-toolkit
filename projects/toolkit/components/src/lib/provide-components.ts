import { Provider } from '@angular/core';
import { provideEvoComponentMeta } from '@evolium-kit/toolkit/core';
import { evoBadgeMeta } from './badge/badge.tokens';
import { evoButtonMeta } from './button/button.tokens';
import { evoCardMeta } from './card/card.tokens';
import { evoInputMeta } from './input/input.tokens';

/** Metadados de todos os componentes da toolkit. */
export const EVO_BUILTIN_COMPONENT_META = [
  evoButtonMeta,
  evoInputMeta,
  evoCardMeta,
  evoBadgeMeta,
] as const;

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
