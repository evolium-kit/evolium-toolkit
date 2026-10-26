import type { ConnectedPosition } from '@angular/cdk/overlay';
import { InjectionToken } from '@angular/core';

/* eslint-disable @typescript-eslint/ban-types */

/**
 * Onde o painel se abre, em relação ao gatilho: `<lado>-<alinhamento>`.
 *
 * `bottom-start` alinha a borda esquerda do painel com a do gatilho (omissão);
 * `bottom-end` alinha as direitas — o normal num botão de ícone à direita.
 * Se não couber no ecrã, vira para o lado oposto sozinho.
 */
export type EvoMenuPlacement =
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'left-start'
  | 'left'
  | 'left-end';

/** Tamanho do menu. Corresponde a `data-evo-size`. */
export type EvoMenuSize = 'sm' | 'md' | 'lg' | (string & {});

/** Um item do menu por dados (`[evoMenuTriggerFor]="entradas"`). */
export interface EvoMenuAction {
  readonly type?: 'item';
  readonly label: string;
  /** Texto para a escrita rápida (typeahead), se for diferente do `label`. */
  readonly typeaheadLabel?: string;
  /** Marca o item como o actual (`aria-current`), como no Joy `selected`. */
  readonly selected?: boolean;
  readonly disabled?: boolean;
  /** Torna o item um link. */
  readonly href?: string;
  /** Chamado ao activar o item (clique, Enter ou Espaço). */
  readonly run?: () => void;
  /** Se existir, o item abre este submenu em vez de correr `run`. */
  readonly children?: readonly EvoMenuEntry[];
  /** Classe(s) CSS do ícone, desenhado antes do texto (como o `iconClass` do `evo-select`). */
  readonly iconClass?: string;
  /** Texto à direita, ex.: o atalho `⌘ K`. */
  readonly suffix?: string;
}

/** Um item com caixa de verificação. */
export interface EvoMenuCheckboxEntry {
  readonly type: 'checkbox';
  readonly label: string;
  readonly checked: boolean;
  readonly disabled?: boolean;
  /** Recebe o novo estado. O menu não guarda o estado: quem o tem é o chamador. */
  readonly run?: (checked: boolean) => void;
}

/** Um item de escolha única, dentro de um grupo. */
export interface EvoMenuRadioEntry {
  readonly type: 'radio';
  readonly label: string;
  readonly value: unknown;
  readonly disabled?: boolean;
}

export interface EvoMenuSeparatorEntry {
  readonly type: 'separator';
}

/** Um grupo com cabeçalho; com itens `radio` é um grupo de escolha única. */
export interface EvoMenuGroupEntry {
  readonly type: 'group';
  readonly label?: string;
  /** Só para itens `radio`: o `value` escolhido. */
  readonly value?: unknown;
  readonly run?: (value: unknown) => void;
  readonly children: readonly (
    EvoMenuAction | EvoMenuCheckboxEntry | EvoMenuRadioEntry | EvoMenuSeparatorEntry
  )[];
}

export type EvoMenuEntry =
  | EvoMenuAction
  | EvoMenuCheckboxEntry
  | EvoMenuRadioEntry
  | EvoMenuSeparatorEntry
  | EvoMenuGroupEntry;

/** Pontos de ancoragem do painel para cada `placement`, e a alternativa quando não cabe. */
export function evoMenuPositions(placement: EvoMenuPlacement, offset: number): ConnectedPosition[] {
  const [lado, alinha = 'center'] = placement.split('-') as [string, string | undefined];
  const vertical = lado === 'bottom' || lado === 'top';
  const oposto = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;

  const posicao = (l: 'top' | 'bottom' | 'left' | 'right', a: string): ConnectedPosition => {
    if (l === 'bottom' || l === 'top') {
      const originX = a === 'start' ? 'start' : a === 'end' ? 'end' : 'center';
      const base: ConnectedPosition = {
        originX,
        originY: l === 'bottom' ? 'bottom' : 'top',
        overlayX: originX,
        overlayY: l === 'bottom' ? 'top' : 'bottom',
      };
      return { ...base, offsetY: l === 'bottom' ? offset : -offset };
    }
    const originY = a === 'start' ? 'top' : a === 'end' ? 'bottom' : 'center';
    const base: ConnectedPosition = {
      originX: l === 'right' ? 'end' : 'start',
      originY,
      overlayX: l === 'right' ? 'start' : 'end',
      overlayY: originY,
    };
    return { ...base, offsetX: l === 'right' ? offset : -offset };
  };

  const l = lado as 'top' | 'bottom' | 'left' | 'right';
  const principal = posicao(l, alinha);
  const virada = posicao(oposto[l], alinha);
  // Se o alinhamento pedido não couber, tenta o contrário no mesmo lado.
  const outro = alinha === 'start' ? 'end' : alinha === 'end' ? 'start' : null;
  const lista = [principal, virada];
  if (outro) lista.push(posicao(l, outro), posicao(oposto[l], outro));
  // Se o lado pedido (vertical/horizontal) não couber de todo, o outro eixo.
  const eixo = vertical ? (['right', 'left'] as const) : (['bottom', 'top'] as const);
  for (const e of eixo) lista.push(posicao(e, 'start'));
  return lista;
}

/**
 * O gatilho que abriu o painel, visto pelo painel. Há dois (`[evoMenuTriggerFor]` e
 * `[evoContextMenuTriggerFor]`), por isso o painel pede-o por este token.
 */
export interface EvoMenuTriggerRef {
  /**
   * `id` do elemento gatilho: o painel usa-o como nome acessível. `null` num menu
   * de contexto, onde o alvo (uma área qualquer) não tem nome.
   */
  readonly id: string | null;
  readonly element: HTMLElement;
  /** Tamanho do menu que contém o gatilho, se for um submenu. */
  readonly size?: () => string | null;
}

export const EVO_MENU_TRIGGER = new InjectionToken<EvoMenuTriggerRef>('EVO_MENU_TRIGGER');
