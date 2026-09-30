import { EvoThemeSnapshot } from '@evolium-kit/toolkit/core';

/**
 * Mensagens trocadas por `postMessage` entre o Studio e o `<iframe>` de
 * pré-visualização. Interno ao Studio — não faz parte da API pública.
 *
 * ```
 * iframe  → Studio   pronto   (arrancou e está à escuta)
 * Studio  → iframe   estado   (componente, variante, tamanho e tema)
 * iframe  → Studio   altura   (altura do conteúdo, para o iframe não ter scroll)
 * ```
 *
 * Os dois lados só aceitam mensagens da mesma origem e da janela esperada
 * (`event.source`) — ver `ehMensagemDoCanal()`.
 */
export const CANAL_PREVIEW = 'evo-theme-studio-preview';

export type EstadoTema = Pick<EvoThemeSnapshot, 'tokens' | 'darkTokens' | 'variants' | 'scheme'>;

export interface MensagemPronto {
  readonly canal: typeof CANAL_PREVIEW;
  readonly tipo: 'pronto';
}

export interface MensagemEstado {
  readonly canal: typeof CANAL_PREVIEW;
  readonly tipo: 'estado';
  readonly id: string;
  readonly variante: string | null;
  readonly tamanho: string | null;
  readonly tema: EstadoTema;
}

export interface MensagemAltura {
  readonly canal: typeof CANAL_PREVIEW;
  readonly tipo: 'altura';
  readonly altura: number;
}

export type MensagemPreview = MensagemPronto | MensagemEstado | MensagemAltura;

/** `true` se `evento` vem de `origem` (a janela esperada), na mesma origem, e é deste canal. */
export function ehMensagemDoCanal(
  evento: MessageEvent,
  origem: MessageEventSource | null | undefined,
  janela: Window,
): evento is MessageEvent<MensagemPreview> {
  return (
    !!origem &&
    evento.source === origem &&
    evento.origin === janela.location.origin &&
    (evento.data as Partial<MensagemPreview> | null)?.canal === CANAL_PREVIEW
  );
}
