import { Type } from '@angular/core';
import { AlertModelTamanho } from '../modal-generico/modal-generico.types';

export type AlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question' | 'verify';

export interface AlertButton {
  label: string;
  onClick?: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
  closeOnClick?: boolean;
}

export interface AlertOptions {
  titulo?: string;
  mensagem?: string;
  icon?: AlertIcon;
  template?: Type<any> | string;
  fecharAoClicarFundo?: boolean;
  botoes?: AlertButton[];
  semBotoes?: boolean;
  temHeader?: boolean
  data?: unknown
  id?: string; // ID único para fechar o modal posteriormente
  tamanho?: AlertModelTamanho
  temFooter?: boolean
  kind?: 'modal' | 'drawer';
  fragment?: string;
  fragmented?: boolean;
  closeOnFragmentRemoval?: boolean;
  /**
   * Listeners para eventos disparados pelo componente template
   *
   * Exemplo:
   * ```typescript
   * on: {
   *   finalisou(eventData) { console.log(eventData); },
   *   cancelado() { console.log('Cancelado'); },
   *   erro(error) { console.error(error); }
   * }
   * ```
   */
  on?: Record<string, (eventData?: any) => void>;
  /**
   *Fragmented se for boolean o modal vai considerar que a abertura/fechamento
   * controlado por fragment/hash do angular/router, e ao fechar o modal o fragmento é retirado
   * router.navigate([], { relativeTo: this.route, queryParams: {} });
  **/
}

export interface ModalReference {
  id: string;
  component: any;
  hostElement: HTMLElement;
}

export interface AlertResult {
  confirmado: boolean;
  botaoIndex?: number;
}
