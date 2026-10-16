import { InjectionToken, Provider } from '@angular/core';

/** Textos do `EvoModal` e do `EvoModalService`, sobreponíveis por `provideEvoModalMessages()`. */
export interface EvoModalMessages {
  /** Rótulo acessível do botão ×. */
  readonly close: string;
  readonly ok: string;
  readonly confirm: string;
  readonly cancel: string;
  /** Títulos por omissão dos atalhos `success()`, `error()`, `warning()` e `info()`. */
  readonly successTitle: string;
  readonly errorTitle: string;
  readonly warningTitle: string;
  readonly infoTitle: string;
  readonly confirmTitle: string;
  /** Mostrado quando o `handler` de uma acção rejeita sem mensagem própria. */
  readonly actionFailed: string;
}

/** As mensagens por omissão, em português. */
export const EVO_MODAL_DEFAULT_MESSAGES: EvoModalMessages = {
  close: 'Fechar',
  ok: 'OK',
  confirm: 'Confirmar',
  cancel: 'Cancelar',
  successTitle: 'Sucesso',
  errorTitle: 'Erro',
  warningTitle: 'Atenção',
  infoTitle: 'Informação',
  confirmTitle: 'Confirmar?',
  actionFailed: 'Não foi possível concluir a operação.',
};

export const EVO_MODAL_MESSAGES = new InjectionToken<EvoModalMessages>('EVO_MODAL_MESSAGES', {
  providedIn: 'root',
  factory: () => EVO_MODAL_DEFAULT_MESSAGES,
});

/**
 * Sobrepõe os textos de todos os modais da aplicação.
 *
 * ```ts
 * provideEvoModalMessages({ ok: 'Entendido', cancel: 'Voltar' })
 * ```
 */
export function provideEvoModalMessages(mensagens: Partial<EvoModalMessages>): Provider {
  return {
    provide: EVO_MODAL_MESSAGES,
    useValue: { ...EVO_MODAL_DEFAULT_MESSAGES, ...mensagens } satisfies EvoModalMessages,
  };
}
