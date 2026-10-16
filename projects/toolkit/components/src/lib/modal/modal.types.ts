/* eslint-disable @typescript-eslint/ban-types */
import { Injector, TemplateRef, Type } from '@angular/core';
import { EvoTokenMap } from '@evolium-kit/toolkit/core';
import { EvoVariant } from '../component-types';
import type { EvoModalRef } from './modal-ref';

/** Largura do modal. Corresponde a `data-evo-size` e a `--evo-modal-width-<size>`. */
export type EvoModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | (string & {});

/**
 * Tom do modal: escolhe o ícone e a sua cor (`--evo-modal-icon-<tom>`).
 * `question` usa a cor de `info`. Um tom do projecto precisa do seu próprio
 * CSS (`.evo-modal-panel[data-evo-tone='x']`) e de um ícone por `slot="icon"`
 * ou pela opção `icon`.
 */
export type EvoModalTone = 'success' | 'danger' | 'warning' | 'info' | 'question' | (string & {});

/** Onde o modal aparece no ecrã. */
export type EvoModalPosition = 'center' | 'top';

/** Porque é que o modal fechou (ou está a tentar fechar). */
export type EvoModalCloseReason =
  'escape' | 'backdrop' | 'close-button' | 'action' | 'programmatic' | 'navigation';

/**
 * Chamada antes de o **utilizador** fechar o modal (Escape, fundo ou ×).
 * Devolver `false` (ou uma promessa de `false`) mantém-no aberto — por
 * exemplo, para perguntar se se perdem alterações por gravar. As acções e o
 * `close()` programático não passam por aqui: são decisões explícitas.
 */
export type EvoModalBeforeCloseFn = (reason: EvoModalCloseReason) => boolean | Promise<boolean>;

/** Um botão do rodapé de um modal aberto pelo `EvoModalService`. */
export interface EvoModalAction<R = unknown> {
  readonly label: string;
  /** Variante do `EvoButton`. Por omissão, `solid`. */
  readonly variant?: EvoVariant;
  /** Resultado com que o modal fecha, se `handler` não devolver outro. */
  readonly value?: R;
  /**
   * Corre ao clicar. Enquanto a promessa não resolver, o botão mostra
   * `loading` e os outros ficam inactivos. Se rejeitar, o modal fica aberto e
   * a mensagem do erro aparece por cima dos botões. Se devolver um valor
   * (diferente de `undefined`), é esse o resultado do modal.
   */
  readonly handler?: (ref: EvoModalRef<R>) => R | void | Promise<R | void>;
  /** `false` para não fechar depois do clique. Por omissão, `true`. */
  readonly closes?: boolean;
  /** Inactivo enquanto devolver `true` (pode ler signals). */
  readonly disabled?: () => boolean;
  /** Recebe o foco ao abrir. Por omissão, o último botão. */
  readonly autofocus?: boolean;
}

/**
 * Mapa de eventos que o conteúdo de um modal pode emitir (`ref.emit()`), por
 * omissão. Para eventos tipados, passar uma interface própria como `E`
 * (`{ gravado: Motorista }`) — não precisa de assinatura de índice.
 */
export type EvoModalEvents = Record<string, unknown>;

/** Listeners para os eventos do conteúdo, por nome. */
export type EvoModalListeners<E extends object> = {
  readonly [K in keyof E]?: (payload: E[K]) => void;
};

/** Opções comuns ao `<evo-modal>` e ao `EvoModalService`. */
export interface EvoModalBaseConfig {
  /** Título visível. Dá o nome acessível ao modal. */
  readonly title?: string;
  /** Nome acessível quando não há título visível. */
  readonly ariaLabel?: string;
  readonly size?: EvoModalSize;
  readonly position?: EvoModalPosition;
  readonly tone?: EvoModalTone;
  /** Clicar no fundo fecha. Por omissão, `true`. */
  readonly closeOnBackdrop?: boolean;
  /** Mostra o botão × no canto. Por omissão, `true`. */
  readonly showClose?: boolean;
  readonly beforeClose?: EvoModalBeforeCloseFn;
}

/** Opções de `EvoModalService.open()`. */
export interface EvoModalConfig<
  D = unknown,
  R = unknown,
  E extends object = EvoModalEvents,
> extends EvoModalBaseConfig {
  /**
   * Identificador, para fechar com `close(id)`. Por omissão, gerado. Abrir um
   * segundo modal com um `id` já aberto devolve o que já existe.
   */
  readonly id?: string;
  /** Texto simples no corpo, quando não há componente/template. */
  readonly message?: string;
  /** Dados para o conteúdo, lidos com `inject(EVO_MODAL_DATA)`. */
  readonly data?: D;
  /**
   * Ícone próprio, em vez do ícone do `tone`. Um `TemplateRef` ou um
   * componente standalone. O `tone` continua a escolher a cor.
   */
  readonly icon?: TemplateRef<unknown> | Type<unknown>;
  /**
   * Botões do rodapé. Sem esta opção, um modal só com mensagem tem um botão
   * "OK", e um modal com componente não tem nenhum. `[]` tira todos.
   */
  readonly actions?: readonly EvoModalAction<R>[];
  /** Listeners para o que o conteúdo emitir com `ref.emit(nome, dados)`. */
  readonly on?: EvoModalListeners<E>;
  /**
   * Liga o modal ao `#fragmento` da URL: ao abrir, o fragmento entra na URL;
   * se sair (botão Voltar, link), o modal fecha; ao fechar, sai da URL. Para
   * o modal reabrir ao recarregar a página, registar o fragmento em
   * `provideEvoModals({ fragments })`. Sem `Router`, é ignorado.
   */
  readonly fragment?: string;
  /**
   * Tokens aplicados só a este modal, como um `[evoTokens]`. O modal vive no
   * fim do `<body>`, por isso não herda os `[evoTokens]` de quem o abriu.
   */
  readonly tokens?: EvoTokenMap;
  /** Injector pai do conteúdo. Por omissão, o do serviço. */
  readonly injector?: Injector;
}

/** Opções de `EvoModalService.alert()` e dos atalhos `success()`, `error()`… */
export interface EvoModalAlertConfig extends EvoModalBaseConfig {
  readonly message?: string;
  /** Ícone próprio, em vez do ícone do `tone`. */
  readonly icon?: TemplateRef<unknown> | Type<unknown>;
  /** Texto do botão. Por omissão, `messages.ok`. */
  readonly okLabel?: string;
  readonly tokens?: EvoTokenMap;
}

/** Opções de `EvoModalService.confirm()`. */
export interface EvoModalConfirmConfig extends EvoModalAlertConfig {
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

/** Opções de `EvoModalService.prompt()`. */
export interface EvoModalPromptConfig extends EvoModalConfirmConfig {
  /** Etiqueta do campo. */
  readonly label?: string;
  readonly value?: string;
  readonly placeholder?: string;
  /** Impede confirmar com o campo vazio. */
  readonly required?: boolean;
}
