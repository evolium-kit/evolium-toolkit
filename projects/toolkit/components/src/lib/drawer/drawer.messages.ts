import { InjectionToken, Provider } from '@angular/core';

/** Textos do `EvoDrawer` e do `EvoDrawerService`, sobreponíveis por `provideEvoDrawerMessages()`. */
export interface EvoDrawerMessages {
  /** Rótulo acessível do botão ×. */
  readonly close: string;
  /** Mostrado quando o `handler` de uma acção rejeita sem mensagem própria. */
  readonly actionFailed: string;
}

/** As mensagens por omissão, em português. */
export const EVO_DRAWER_DEFAULT_MESSAGES: EvoDrawerMessages = {
  close: 'Fechar painel',
  actionFailed: 'Não foi possível concluir a operação.',
};

export const EVO_DRAWER_MESSAGES = new InjectionToken<EvoDrawerMessages>('EVO_DRAWER_MESSAGES', {
  providedIn: 'root',
  factory: () => EVO_DRAWER_DEFAULT_MESSAGES,
});

/**
 * Sobrepõe os textos de todos os drawers da aplicação.
 *
 * ```ts
 * provideEvoDrawerMessages({ close: 'Dispensar' })
 * ```
 */
export function provideEvoDrawerMessages(mensagens: Partial<EvoDrawerMessages>): Provider {
  return {
    provide: EVO_DRAWER_MESSAGES,
    useValue: { ...EVO_DRAWER_DEFAULT_MESSAGES, ...mensagens } satisfies EvoDrawerMessages,
  };
}
